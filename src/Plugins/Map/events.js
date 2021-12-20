const { getMap, getMapChangeCellIdsBySide } = require("./util.js");

const mapPositions = require("../../Assets/mapPositions.json");
const subAreas = require("../../Assets/subAreas.json");
const logger = require("../../Libs/Logger.js");

const types = {
	"GameRolePlayCharacterInformations": "player",
	"GameFightCharacterInformations": "player",
	"GameRolePlayNpcInformations": "npc",
	"GameRolePlayNpcWithQuestInformations": "npc",
	"GameRolePlayMerchantInformations": "marchand",
	"GameRolePlayGroupMonsterInformations": "monster",
	"GameFightMonsterInformations": "monster"
}

const aggressives = [
    54,64,65,68,72,74,75,76,82,87,88,89,90,91,93,94,95,96,97,99,102,107,108,110,111,113,123,124,127,155,157,170,171,173,178,179,180,181,182,
  	211,212,213,214,216,226,228,229,230,231,232,233,249,252,253,255,257,261,263,289,290,291,292,296,372,378,379,380,396,423,442,446,447,449,450,
  	457,464,465,466,475,478,479,481,488,525,527,528,529,535,536,537,568,583,584,585,586,587,588,589,590,594,595,596,597,598,600,601,603,612,651,744,
    746,747,748,749,751,752,753,754,755,756,758,759,760,761,762,763,780,783,784,785,786,789,790,792,827,876,891,932,935,936,937,938,939,940,941,
  	942,943,1015,1018,1029,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1071,1072,1073,1074,1075,1077,1080,1082,1084,1085,1086,1087,1108,
  	1153,1154,1155,1156,1157,1158,1159
];

module.exports = class Events {
	constructor() {
		this.listeners = [
			this.CurrentMapMessage,
			this.GameRolePlayShowActorMessage,
			this.GameContextRemoveElementMessage,
			this.GameMapMovementMessage,
			// this.ObjectGroundListAddedMessage,
			// this.PrismsListMessage,
			// this.StatedElementUpdatedMessage,
			this.InteractiveElementUpdatedMessage,
			this.MapComplementaryInformationsDataMessage
		];
	}

	/**
	 * @private
	 * Initialise a new map
	 *
	 * @param {Object} payload
	 */
	async CurrentMapMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		const mapId = data.mapId;
		const mapData = await getMap(mapId);
		
		const changeCells = getMapChangeCellIdsBySide(mapData.cells)
		accounts[username].plugins.Map = {
			id: mapId,
			pos: {x: mapPositions.find(e => e.id == mapId).posX, y: mapPositions.find(e => e.id == mapId).posY},
			interactiveElements: {},
			statedElements: {},
			actors: {},
			houses: {},
			midgroundLayer: mapData.midgroundLayer,
			
			area: null,
			subArea: null,
			
			cells: mapData.cells,
			topNeighbourId: changeCells.top.length > 0 ? mapData["topNeighbourId"] : false,
			bottomNeighbourId: changeCells.bottom.length > 0 ? mapData["bottomNeighbourId"] : false,
			leftNeighbourId: changeCells.left.length > 0 ? mapData["leftNeighbourId"] : false,
			rightNeighbourId: changeCells.right.length > 0 ? mapData["rightNeighbourId"] : false,
			
			sendScriptSignal: true
		}
				
		/*accounts[username].plugins.Map.id = mapId
		
		
		accounts[username].plugins.Map.cells = mapData.cells;
		accounts[username].plugins.Map.topNeighbourId = mapData["topNeighbourId"];
		accounts[username].plugins.Map.bottomNeighbourId = mapData["bottomNeighbourId"];
		accounts[username].plugins.Map.leftNeighbourId = mapData["leftNeighbourId"];
		accounts[username].plugins.Map.rightNeighbourId = mapData["rightNeighbourId"];
		
		
		accounts[username].plugins.Map.midgroundLayer = mapData.midgroundLayer*/
		
		accounts[username].pathfinder.fillPathGrid(mapData);
		
		socket.sendMessage("MapInformationsRequestMessage", { mapId });
	}

	/**
	 * @private
	 * Store detailed in-game data such as entities and interactive elements
	 *
	 * @param {Object} payload
	 */
	async MapComplementaryInformationsDataMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		var accessibleCells = [];
		var obstacleCells = [];
		var actorCells = [];
		var interactiveElementIds = [];
		var chmichat = [];
		
		const mapData = await getMap(data.mapId);
		
		const sendScriptSignal = accounts[username].plugins.Map.sendScriptSignal
		
		accounts[username].plugins.Map.id = data.mapId
		
		for (const actor of data.actors) {
			// console.log("Adding actor ", actor.contextualId)
			accounts[username].plugins.Map.actors[actor.contextualId] = actor
			if(!types[actor._type]) console.log(actor._type)
			var monsters = null;
			if(actor._type == "GameRolePlayGroupMonsterInformations"){
				monsters = [actor.staticInfos.mainCreatureLightInfos.staticInfos.nameId, ...actor.staticInfos.underlings.map(e => e = e.staticInfos.nameId)].join("\n")
				const monsterList = [actor.staticInfos.mainCreatureLightInfos.creatureGenericId, ...actor.staticInfos.underlings.map(e => e = e.creatureGenericId)]
				if(monsterList.filter(e => aggressives.includes(e)).length != 0) accounts[username].plugins.Map.actors[actor.contextualId]["agro"] = true
			}
			actorCells.push({
				cell: actor.disposition.cellId, 
				name: monsters || actor.name || (actor._npcData ? actor._npcData.nameId : false), 
				type: actor.contextualId == accounts[username].extra.selectedCharacter.id ? "me" : types[actor._type],
				id: (actor._npcData ? actor._npcData.id : actor.contextualId),
				agro: accounts[username].plugins.Map.actors[actor.contextualId]["agro"]
			})

		}
		
		
		for(const e of Object.keys(mapData.midgroundLayer)){
				// if(!mapData.midgroundLayer[e][0]) continue;
				
			for(const element of mapData.midgroundLayer[e]){	
				if(element.id){
					const index = data.interactiveElements.findIndex(e => e.elementId == element.id)
					if(index != -1){
						data.interactiveElements[index]["cell"] = e;
						break;
					}
				}
					
				if(element.g == 21000) chmichat.push(e)
			}
		}
		
		for (const house of data.houses) {
			accounts[username].plugins.Map.houses[house.houseId] = house
		}
		
		for (var interactiveElement of data.interactiveElements) {
			
			
			if(interactiveElement["_houseData"]){
				var i = interactiveElement.enabledSkills.findIndex(skill => skill["_name"] == "Entrer")
				if(i != -1) interactiveElement.enabledSkills[i]["isLocked"] = true;
				else{
					interactiveElement.disabledSkills.findIndex(skill => skill["_name"] == "Entrer")
					if(i != -1) interactiveElement.disabledSkills[i]["isLocked"] = true;
				}
				
				if(!interactiveElement["_name"]) interactiveElement["_name"] = "Maison de " + accounts[username].plugins.Map.houses[interactiveElement["_houseData"].houseId]["ownerName"]
			}
			
			accounts[username].plugins.Map.interactiveElements[interactiveElement.elementId] = interactiveElement;
			interactiveElementIds.push({
				name: interactiveElement["_name"], 
				cell: interactiveElement.cell,
				id: interactiveElement.elementId,
				enabledSkills: interactiveElement.enabledSkills.map(skill => [skill["_name"], skill.isLocked] || [skill.skillInstanceUid, skill.isLocked]),
				disabledSkills: interactiveElement.disabledSkills.map(skill => [skill["_name"], skill.isLocked] || [skill.skillInstanceUid, skill.isLocked])
			})
			
			// console.log(interactiveElement.enabledSkills.map(skill => skill.skillInstanceUid))
			// if(interactiveElement["_name"]) console.log("Added interactiveElement", interactiveElement.elementId, interactiveElement["_name"])
		}
		/*for (const statedElement of data.statedElements) {
			store.dispatch(
				addStatedElement({
					username,
					statedElement
				})
			);
		}*/
		
		const mapCoords = mapPositions.find(e => e.id == data.mapId);
		
		
		
		
		for(var cellId in mapData.cells){
			if(!mapData.cells[cellId].l) obstacleCells.push(cellId);
			if([67, 3, 195, 75, 83, 71, 7].includes(mapData.cells[cellId].l)) accessibleCells.push(cellId);
			
			if(mapData.cells[cellId].s == -5 && mapData.cells[cellId].l == 67 && !chmichat.includes(cellId)) chmichat.push(cellId)

		}
		
		logger.info(`[${username}] Map | Current map: [${mapCoords.posX}, ${mapCoords.posY}]. `);
	
		accounts[username].plugins.Map.area = subAreas[data.subAreaId].area;
		accounts[username].plugins.Map.subArea = subAreas[data.subAreaId].name;
		
		const toSendMap = {
			username,
			pos: `[${mapCoords.posX}, ${mapCoords.posY}]`,
			id: data.mapId,
			subArea: `${subAreas[data.subAreaId].area} (${subAreas[data.subAreaId].name})`,
			accessibleCells,
			obstacleCells,
			interactiveElementIds,
			actorCells, //susceptible for change
			chmichat,
			top: accounts[username].plugins.Map.topNeighbourId,
			bottom: accounts[username].plugins.Map.bottomNeighbourId,
			left:accounts[username].plugins.Map.leftNeighbourId,
			right: accounts[username].plugins.Map.rightNeighbourId,
			fight: accounts[username].plugins.Fighter.fighting
		}
		
		global.accounts[username].plugins.Map.toSendMap = toSendMap;
		sendToBrowser("MAP", toSendMap)
		
		accounts[username].plugins.Map.sendScriptSignal = false
		
		if(sendScriptSignal){
			const party = parties.find(party => party.members.includes(username))
			if(party){
				if(!party.checkReady()){
					socket.eventEmitter.once("PARTY_READY", () => socket.eventEmitter.emit("nextMapReady"));
					
					/**
					* attempt to reach leader
					**/
					/*if(accounts[username].state == "WAITING FOR PARTY" && !accounts[username].script.running){
						console.log("attempting to reach leader")
						const leaderMap = accounts[party.leader].plugins.Map
						const neighbors = { //reversed because of the code below
							bbttom: leaderMap.topNeighbourId,
							top: leaderMap.bottomNeighbourId,
							right: leaderMap.leftNeighbourId,
							left: leaderMap.rightNeighbourId
						}
						
						// console.log(neighbors)
						if(Object.values(neighbors).includes(data.mapId)){
							console.log("moving")
							plugins.Map.moveToSide(username, Object.keys(neighbors).find(key => neighbors[key] == data.mapId))
						}
					}*/
					return;
				}
				
				
			}
			socket.eventEmitter.emit("nextMapReady");
		}
	}

	/**
	 * @private
	 * Add a new actor in the list
	 *
	 * @param {Object} payload
	 */
	GameRolePlayShowActorMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		accounts[username].plugins.Map.actors[data.informations.contextualId] = data.informations

		const actor = data.informations;
		if(!types[actor._type]) console.log(actor._type)
			
		var monsters = null;
		if(actor._type == "GameRolePlayGroupMonsterInformations"){
			monsters = [actor.staticInfos.mainCreatureLightInfos.staticInfos.nameId, ...actor.staticInfos.underlings.map(e => e = e.staticInfos.nameId)].join("\n")
		}
		sendToBrowser("UPDATE_MAP_ACTORS", {
			username,
			oldActor: null,
			newActor: {
				cell: actor.disposition.cellId, 
				name: monsters || actor.name || (actor._npcData ? actor._npcData.nameId : false), 
				type: types[actor._type]	,
				id: (actor._npcData ? actor._npcData.id : actor.contextualId)
			}
		})
		
		if(accounts[username].plugins.Map.toSendMap)
			global.accounts[username].plugins.Map.toSendMap.actorCells.push({
				cell: actor.disposition.cellId, 
				name: monsters || actor.name || (actor._npcData ? actor._npcData.nameId : false), 
				type: types[actor._type]	,
				id: (actor._npcData ? actor._npcData.id : actor.contextualId)
			})
		
	}

	GameContextRemoveElementMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		if(accounts[username].plugins.Map.actors[data.id]){
			var monsters = null;
			if(accounts[username].plugins.Map.actors[data.id]._type == "GameRolePlayGroupMonsterInformations"){
				monsters = [accounts[username].plugins.Map.actors[data.id].staticInfos.mainCreatureLightInfos.staticInfos.nameId, ...accounts[username].plugins.Map.actors[data.id].staticInfos.underlings.map(e => e = e.staticInfos.nameId)].join("\n")
			}
			sendToBrowser("UPDATE_MAP_ACTORS", {
				username,
				oldActor: {
					cell: accounts[username].plugins.Map.actors[data.id].disposition.cellId,
					id: (accounts[username].plugins.Map.actors[data.id]._npcData ? accounts[username].plugins.Map.actors[data.id]._npcData.id : data.id),
					name: monsters || accounts[username].plugins.Map.actors[data.id].name || (accounts[username].plugins.Map.actors[data.id]._npcData ? accounts[username].plugins.Map.actors[data.id]._npcData.nameId : false)
				},
				newActor: null
			})
		
			delete global.accounts[username].plugins.Map.actors[data.id]
			
			global.accounts[username].plugins.Map.toSendMap.actorCells = accounts[username].plugins.Map.toSendMap.actorCells.filter(e => e.id != data.id);
		}
	}

	/**
	 * @private
	 * Update the entity disposition
	 *
	 * @param {Object} payload
	 */
	GameMapMovementMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		const account = accounts[username];
		
		if(account.plugins.Fighter.fighting) account.plugins.Map.actors = account.plugins.Fighter.fighters
		
		if(!account.plugins.Map.actors.hasOwnProperty(data.actorId)) return;
		
		var actor = account.plugins.Map.actors[data.actorId];
		const actorCurrentCellId = data.keyMovements[data.keyMovements.length - 1];
		
		if(!types[actor._type]) console.log(actor._type)
			
		var monsters = null;
		if(actor._type == "GameRolePlayGroupMonsterInformations"){
			monsters = [actor.staticInfos.mainCreatureLightInfos.staticInfos.nameId, ...actor.staticInfos.underlings.map(e => e = e.staticInfos.nameId)].join("\n")
		}
		
		var type = actor.contextualId == account.extra.selectedCharacter.id ? "me" : types[actor._type]
		// if(actor._type == "GameFightMonsterInformations") type = actor.teamId == account.plugins.Fighter.teamId ? (actor.contextualId == account.extra.selectedCharacter.id ? "me" : "player") : "monster",
		if(account.plugins.Fighter.fighting) type = actor.teamId == account.plugins.Fighter.teamId ? (actor.contextualId == account.extra.selectedCharacter.id ? "me" : "player") : "monster"
		
		var options = {
			username,
			oldActor: {
				cell: actor.disposition.cellId,
				id: (actor._npcData ? actor._npcData.id : actor.contextualId),
				name: monsters || actor.name || (actor._npcData ? actor._npcData.nameId : false)
			},
			newActor: {
				cell: actorCurrentCellId, 
				name: monsters || actor.name || (actor._npcData ? actor._npcData.nameId : false), 
				type,
				id: (actor._npcData ? actor._npcData.id : actor.contextualId)
			}
		}
		
		
			
			
		
		accounts[username].pathfinder.direction = actor.disposition.direction;
		accounts[username].pathfinder.isRiding = actor.isMounted || false;
		accounts[username].pathfinder.isFightMode = account.plugins.Fighter.fighting;
		
		const coeff = (configs[username].speedhack && !accounts[username].plugins.Fighter.fighting && actor.contextualId == account.extra.selectedCharacter.id) ? 10 : 1 
		const pathDuration = accounts[username].pathfinder.getPathDuration(data.keyMovements, account.plugins.Map.cells) / coeff;
		
		actor.disposition.cellId = actorCurrentCellId //update
		
		if(accounts[username].plugins.Map.toSendMap){
			const i = accounts[username].plugins.Map.toSendMap.actorCells.findIndex(e => e.id == actor.contextualId)
			// console.log(i, accounts[username].plugins.Map.toSendMap.actorCells, actor.contextualId)
			if(accounts[username].plugins.Map.toSendMap.actorCells[i]){
				global.accounts[username].plugins.Map.toSendMap.actorCells[i].cell = actorCurrentCellId
				global.accounts[username].plugins.Map.toSendMap.fight = account.plugins.Fighter.fighting;
				
			}
		}
		
		setTimeout(()=>{
			if(!account.plugins.Map.actors[data.actorId]) options.newActor = null;
			sendToBrowser("UPDATE_MAP_ACTORS", options)
		}, pathDuration);
			
		if(account.plugins.Fighter.fighting){
			// var normalizedPath=this.pathfinder.normalizePath(data.keyMovements)
			// this.fighterStats[username].movementPointsCurrent-=(normalizedPath.length+1)
			if(!account.plugins.Fighter.fighters[actor.contextualId]) console.log("ACTOR MOVED IN FIGHT BUT NOT FOUND IN OBJECT:", actor.contextualId)
			account.plugins.Fighter.fighters[actor.contextualId].disposition.cellId = actorCurrentCellId
		}
	}

	/**
	 * @private
	 * Set items dropped on the ground
	 *
	 * @param {Object} payload
	 */
	/*ObjectGroundListAddedMessage(payload) {
		this.objectsOnGround = payload.data;
	}*/

	/**
	 * @private
	 * Set the list of current prisms of the world
	 *
	 * @param {Object} payload
	 */
	/*PrismsListMessage(payload) {
		this.prisms = payload.prisms;
	}*/

	/**
	 * @private
	 * Update fixed elements on the map
	 *
	 * @param {Object} payload
	 */
	/*StatedElementUpdatedMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		const account = store.getState().accounts[username];
		// if (!Object.keys(account.plugins.Map.statedElements).includes(data.statedElement.elementId)) {
			store.dispatch(
				addStatedElement({
					username,
					statedElement: data.statedElement
				})
			);
		// }
	}*/

	/**
	 * @private
	 * Update interactive elements on the map
	 *
	 * @param {Object} payload
	 */
	InteractiveElementUpdatedMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		const account = accounts[username];
		
		// if(!account.plugins.Map.interactiveElements.hasOwnProperty(data.interactiveElement.elementId)) return;
		
		// const interactiveElement = account.plugins.Map.interactiveElements[data.interactiveElement.elementId]
		accounts[username].plugins.Map.interactiveElements[data.interactiveElement.elementId] = data.interactiveElement;
		
		var interactiveElement = account.plugins.Map.interactiveElements[data.interactiveElement.elementId]
		
		if(interactiveElement["_houseData"]){
			var i = interactiveElement.enabledSkills.findIndex(skill => skill["_name"] == "Entrer")
			if(i != -1) interactiveElement.enabledSkills[i]["isLocked"] = true;
			else{
				interactiveElement.disabledSkills.findIndex(skill => skill["_name"] == "Entrer")
				if(i != -1) interactiveElement.disabledSkills[i]["isLocked"] = true;
			}
			
			if(!interactiveElement["_name"]) interactiveElement["_name"] = "Maison de " + accounts[username].plugins.Map.houses[interactiveElement["_houseData"].houseId]["ownerName"]
		}
		
		var i = accounts[username].plugins.Map.toSendMap ? accounts[username].plugins.Map.toSendMap.interactiveElementIds.findIndex(e => e.id == data.interactiveElement.elementId) : -1
		if(i != -1){
			global.accounts[username].plugins.Map.toSendMap.interactiveElementIds[i].enabledSkills = interactiveElement.enabledSkills.map(skill => [skill["_name"], skill.isLocked] || [skill.skillInstanceUid, skill.isLocked]);
			global.accounts[username].plugins.Map.toSendMap.interactiveElementIds[i].disabledSkills = interactiveElement.disabledSkills.map(skill => [skill["_name"], skill.isLocked] || [skill.skillInstanceUid, skill.isLocked])
		}
		
		sendToBrowser("INTERACTIVE_UPDATE", {
			username,
			element: {
				id: interactiveElement.elementId,
				enabledSkills: interactiveElement.enabledSkills.map(skill => [skill["_name"], skill.isLocked] || [skill.skillInstanceUid, skill.isLocked]),
				disabledSkills: interactiveElement.disabledSkills.map(skill => [skill["_name"], skill.isLocked] || [skill.skillInstanceUid, skill.isLocked])
			}
		})
	}

}
