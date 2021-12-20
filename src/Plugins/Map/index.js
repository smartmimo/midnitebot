const { getRandomClosestMapChangeCells } = require("./util.js");
const { getNeighbourCells } = require("../Fighter/util.js");
const logger = require("../../Libs/Logger.js");
const mapPositions = require("../../Assets/mapPositions.json");

const fs = require("fs");
const Events = require("./events");

function sleep(ms){
	return new Promise(resolve=>{
		setTimeout(resolve,ms)
	})
}

const aggressives = [
    54,64,65,68,72,74,75,76,82,87,88,89,90,91,93,94,95,96,97,99,102,107,108,110,111,113,123,124,127,155,157,170,171,173,178,179,180,181,182,
  	211,212,213,214,216,226,228,229,230,231,232,233,249,252,253,255,257,261,263,289,290,291,292,296,372,378,379,380,396,423,442,446,447,449,450,
  	457,464,465,466,475,478,479,481,488,525,527,528,529,535,536,537,568,583,584,585,586,587,588,589,590,594,595,596,597,598,600,601,603,612,651,744,
    746,747,748,749,751,752,753,754,755,756,758,759,760,761,762,763,780,783,784,785,786,789,790,792,827,876,891,932,935,936,937,938,939,940,941,
  	942,943,1015,1018,1029,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1071,1072,1073,1074,1075,1077,1080,1082,1084,1085,1086,1087,1108,
  	1153,1154,1155,1156,1157,1158,1159
];



module.exports = class Map extends Events {
	constructor() {
		super();
	}
	
	async moveToCell(username, cellId){
		if(!accounts[username] || accounts[username].state == "MOVING") return false;
		const connection = accounts[username].socket;
		if(!connection) return;
		const state = accounts[username].state;
		// if(state == "FIGHTING") accounts[username].plugins.Map.actors = accounts[username].plugins.Fighter.fighters;
		// const oldActorData = accounts[username].plugins.Map.actors[accounts[username].extra.selectedCharacter.id].disposition.cellId;
		try{
			await this.GameMapMovementRequestMessage(
				username,
				cellId
			);
			/*connection.eventEmitter.once("CurrentMapMessage", (payload) => {
				const { socket, data } = payload;
				connection.sendMessage("MapInformationsRequestMessage", { mapId: data.mapId })
			})*/
			sendToBrowser("CLEAR_PATH", {username})
			return true
		}
		catch(error){
			logger.error(error)
			if(accounts[username].state == "MOVING") setState(username, state);
			// accounts[username].plugins.Map.actors[accounts[username].extra.selectedCharacter.id].disposition.cellId = oldActorData;
			// if(state == "FIGHTING") accounts[username].plugins.Map.fighters[accounts[username].extra.selectedCharacter.id] = oldActorData;
			return false
		}
	}
	
	
	useInteractiveByCell(username, cellId){
		const element = Object.values(accounts[username].plugins.Map.interactiveElements).find(e => e.cell == cellId)
		if(!element){
			sendToBrowser("LOG", {
				username,
				html: `<p class='error'>La cellule <span style='color:white;'>${cellId}</span> ne contient pas un élement interactif.</p>`
			})
			return false;
		}
		
		return this.useInteractiveElement(username, element.elementId)
	}
	
	
	/**
	 * Move to an adjacent cell of an element on the map and use the interactive element
	 *
	 * @param {string} elementId Selected interactive element id
	 * @param {Number} skillInstanceUid
	 *
	 * @returns {Promise}
	 */
	async useInteractiveElement(username, elementId, skillName = 0, lock = false, retry = 1) {
		const account = accounts[username];
		const connection = accounts[username].socket;
		
		var script;
		
		await new Promise(async (resolve, reject) => {
			if(account.script.running){
				script = true;
				account.socket.eventEmitter.once("stopScript", resolve);
			}
			
			var i = 0;
			while(i < 6){
				if(script && !account.script.running) return;
				if(account.plugins.Map.interactiveElements[elementId]) return resolve();
				i++;
				await sleep(1000)
			}
			
			/*sendToBrowser("LOG", {
				username, 
				html: `<p class='error'>TIMEOUT: L'élement interactif ${elementId} n'a pas été trouvé dans la map.</p>`
			})*/
			reject(new Error(`INTERACTIVE: Timeout, l'élement interactif ${elementId} n'a pas été trouvé dans la map.`))
		})
		
		if(script && !account.script.running) return;
		
		if(account.state == "FIGHTING") return;
		
		const map = account.plugins.Map;
		
		return new Promise(async (resolve, reject) => {
			
			const interactiveElement = map.interactiveElements[elementId];
			const cellId = interactiveElement.cell;
			
			const enabledSkill = interactiveElement.enabledSkills.find(
					// skill => skill.skillInstanceUid === skillInstanceUid
					skill => skill["_name"] === skillName
				) || interactiveElement.enabledSkills[skillName];
			
			const skillInstanceUid = enabledSkill.skillInstanceUid
			const validActions = [
				!interactiveElement,
				cellId === false,
				!enabledSkill
			];
			if (validActions.includes(true)) {
				const elementTypes = ["id", "cell id", "action"];
				const elementType = elementTypes[validActions.indexOf(true)];
				
				if(retry == 5){
					reject(new Error(`INTERACTIVE: ${elementType} non trouvé.`))
				} else {
					sendToBrowser("LOG", {
						username, 
						html: `<p class='error'>INTERACTIVE: ${elementType} non trouvé, tentative ${retry} dans 2 secondes..</p>`
					})
					await sleep(2000)
					resolve(await this.useInteractiveElement(username, elementId, skillName, lock, retry + 1))
				}
				
			}
			try {
				await this.GameMapMovementRequestMessage(
					username,
					cellId,
					true
				);
				
				setState(username, "INTERACTING");
				
				for(const id in accounts[username].jobs){
					const job = accounts[username].jobs[id];
					if(job.skills.find(skill => skill.id == enabledSkill.skillId)){
						setState(username, "GATHERING");
						break;
					}
				}
				
				
				
				connection.eventEmitter.once("InteractiveUseErrorMessage", (payload) => {
					connection.eventEmitter.off("InteractiveUsedMessage")
					sendToBrowser("LOG", {
						username,
						html: `<p class='error'>Erreur lors de l'utilisation de l'élement interactif ${payload.data.elemId}: InteractiveUseErrorMessage</p>`
					})
					
					// console.log(interactiveElement.enabledSkills, payload.data)
					global.accounts[username].plugins.Map.interactiveElements[payload.data.elemId].enabledSkills = interactiveElement.enabledSkills.filter(e => e.skillId != payload.data.skillInstanceUid);
					// console.log(accounts[username].plugins.Map.interactiveElements[payload.data.elemId].enabledSkills)
					
					setState(username, "IDLE");
					
					reject(new Error(`InteractiveUseErrorMessage`))
				})
				connection.eventEmitter.on("InteractiveUsedMessage", async (payload) =>{
					
					// if(payload.data.elemId==elementId && payload.data.skillId==enabledSkill.skillId){
					if(payload.data.entityId == account.extra.selectedCharacter.id){
						connection.eventEmitter.off("InteractiveUsedMessage")
						connection.eventEmitter.off("InteractiveUseErrorMessage")
						
						if(payload.data.duration > 0){
							await new Promise(r => {
								connection.eventEmitter.on("InteractiveUseEndedMessage", (payload) => {
									if(payload.data.elemId==elementId && payload.data.skillId == enabledSkill.skillId) r(connection.eventEmitter.off("InteractiveUseEndedMessage"));
								})
							})
						}
						
						if(lock){
							await new Promise(r => {
								connection.eventEmitter.once("LockableShowCodeDialogMessage", (payload) => {
									const size = payload.data.codeSize;
									
									var code = "";
									for (var i = 0; i < size; i++) {
										code += isNaN(parseInt(lock[i])) ? '_' : parseInt(lock[i]);
									}
							
									sendToBrowser("LOG", {
										username,
										html: `<p class='warn'>Utilisation de l'élement interactif avec le code <span style='color:white;'>${code}</code></p>`
									})
									
									/*if(payload.data.fromInside) {
										connection.sendMessage("HouseLockFromInsideRequestMessage", {
											code
										})
									}
							
									else if(payload.data.changeOrUse) {
										connection.sendMessage("LockableChangeCodeMessage", {
											code
										})
									}
									else connection.sendMessage("LockableUseCodeMessage", {
										code
									})*/
									
									connection.eventEmitter.once("LockableCodeResultMessage", (payload) => {
										const resultText = {
											0: `<p class='success'>Le code a été changé.</p>`,
											1: `<p class='error'>Le code <span style='color:white;'>${code}</span> est erroné.</p>`,
											2: `<p class='error'>Le code <span style='color:white;'>${code}</span> est erroné.</p>`
										}
										if(resultText[payload.data.result]) {
											sendToBrowser("LOG", {
												username,
												html: resultText[payload.data.result]
											})
										}
										r()
									})
									
									connection.sendMessage("LockableUseCodeMessage", {
										code
									})
									
									
								})
							})
							
						}
						sendToBrowser("CLEAR_PATH", {username})
						setState(username, "IDLE");
						resolve(true)
					}
				});
				
				
				connection.sendMessage("InteractiveUseRequestMessage", {
					elemId: elementId,
					skillInstanceUid
				});
				
			} catch (error) {
				reject(error);
			}
		});
	}
	
	getZaap(username, zaapi = false){
		const account = accounts[username];
		const map = account.plugins.Map;
		for (var i in map.interactiveElements) {
			const interactiveElement = map.interactiveElements[i]
			if(interactiveElement["_name"]=="Zaap" + (zaapi ? "i" : "")){					
				const zaap={
					id: interactiveElement.elementId
				}
				return zaap;
			}
		}
		return false
	}
		
	async saveZaap(username){
		const zaap = await this.getZaap(username)
		if(!zaap){
			sendToBrowser("LOG", {
				username,
				html: "<p class='error'>Il n'y a pas de zaap dans votre position.</p>"
			})
			return false;
		}
		
		this.useInteractiveElement(username, zaap.id, 1)
	}
	
	useZaap(username, x, y, zaapi = false){
		const connection = accounts[username].socket;
		return new Promise(async (resolve, reject) => {
			const zaap = await this.getZaap(username, zaapi)
			if(!zaap){
				sendToBrowser("LOG", {
					username,
					html: "<p class='error'>Il n'y a pas de zaap" + zaapi ? "i" : "" + " dans votre position.</p>"
				})
				resolve(false)
				return;
			}
			try{
				this.useInteractiveElement(username, zaap.id, "Utiliser")
				connection.eventEmitter.once("ZaapListMessage", (payload) =>{
					const {socket, data} = payload;
					const mapId = (data["_maps"].find(map => map.posX==x && map.posY==y)).id
					if(!mapId){
						sendToBrowser("LOG", {
							username,
							html: `<p class='error'>La map [${x}, ${y}] n'est pas dans le zaap${zaapi ? "i" : ""}.</p>`
						})
						resolve(false)
						return;
					}
					socket.sendMessage("TeleportRequestMessage", {
						teleporterType: zaapi ? 1 : 0,
						mapId
					})
					/*connection.eventEmitter.once("CurrentMapMessage", (payload) => {
						const { socket, data } = payload;
						connection.sendMessage("MapInformationsRequestMessage", { mapId: data.mapId })
					})*/
					connection.eventEmitter.once("MapComplementaryInformationsDataMessage", (payload) => {	
						resolve(true);
					})
				});
			}
			catch(e){
				reject(e)
			}
		})
	}
	
	/**
	 * Get the element cell id on the map from its id
	 *
	 * @param {Number} elementId
	 *
	 * @returns {Boolean|Number}
	 */
	/*findInteractiveElementCellId(username, elementId) {
		const account = accounts[username];

		for (let cellId in account.plugins.Map.midgroundLayer) {
			for (let midround of account.plugins.Map.midgroundLayer[cellId]) {
				if (midround.id === parseInt(elementId)) {
					return cellId;
				}
			}
		}
		return false;
	}*/
	
	/**
	 * Follow a set of sides
	 *
	 * @param {array} sides
	 *
	 * @returns {Promise} Boolean
	 */
	async followPath(username, sides) {
		
		var account = accounts[username];
		var mapId = account.plugins.Map.id;
		logger.info(`[${username}] ` + "Map | Following these instructions until there is nothing to follow: "+ JSON.stringify(sides, null, 2))
		
		var script;
		
		return new Promise(async (resolve, reject)=>{
			if(account.script.running){
				script = true;
				account.socket.eventEmitter.once("stopScript", resolve);
			}
			while(true) {
				if(!accounts[username]){
					resolve()
					break;
				}
				
				if(script && !account.script.running) break;
				if(accounts[username].state == "MOVING") continue;
				await sleep(1000)
				account = accounts[username];
				mapId = account.plugins.Map.id;
				var mapD = mapPositions.find(e => e.id == mapId);
				var i=`${mapD.posX},${mapD.posY}`
				if(Object.keys(sides).includes(mapId.toString())) i = mapId.toString()
				if(!Object.keys(sides).includes(i)) break;
				logger.info(`[${username}] ` + "Map | Moving to the "+sides[i])
				try{
					const mapChange = await this.ChangeMapMessage(
						username,
						sides[i]
					);
					
					// if(!mapChange) break;
				}
				catch(e){
					reject(new Error(`Something went wrong while trying to move to the ${sides[i]}: ${e.message}`));
					resolve()
					break;
				}
			}
			logger.info(`[${username}] Map | followPath: Over.`)
			sendToBrowser("LOG", {
				username, 
				html: `<p class='info'>followPath: over.</p>`
			})
			resolve();
		})
	}
	
	async freeSoul(username) {
		const connection = accounts[username].socket;
		return new Promise((resolve)=>{
			connection.sendMessage("GameRolePlayFreeSoulRequestMessage")
			const timeoutId = setTimeout(resolve, 10000)
			/*connection.eventEmitter.once("CurrentMapMessage", (payload) => {
				const { socket, data } = payload;
				connection.sendMessage("MapInformationsRequestMessage", { mapId: data.mapId })
			})*/
			connection.eventEmitter.once("MapComplementaryInformationsDataMessage", (payload) => {
				clearTimeout(timeoutId)
				resolve();
			})
		})
	}
	
	async moveToSide(username, side) {
		
		var account = accounts[username];
		
		if(!account || account.state == "MOVING") return false;
		
		var mapId = account.plugins.Map.id;
		var mapD = mapPositions.find(e => e.id == mapId);
		logger.info(`[${username}] ` + "Map | Moving to the "+side)
		const oldActorData = accounts[username].plugins.Map.actors[account.extra.selectedCharacter.id].disposition.cellId
		return new Promise(async (resolve, reject)=>{
			try{
				await this.ChangeMapMessage(
					username,
					side
				);
			} catch(e){
				logger.error(
					`[${username}] Map | Something went wrong while trying to move to the ${side}: ${e.message}`
				);
				/*sendToBrowser("LOG", {
					username, 
					html: `<p class='error'>Erreur lors du déplacement: <pre>${e.message}</pre></p>`
				})*/
				setState(username, "IDLE");
				accounts[username].plugins.Map.actors[account.extra.selectedCharacter.id].disposition.cellId = oldActorData;
				reject(e)
			}				
			resolve()
		})
	}
	
	/**
	 * Travel to a defined x and y position on the world
	 *
	 * @param {Number} x
	 * @param {Number} y
	 *
	 * @returns {Promise} Boolean
	 */
	/*async goToMap(username, x, y) {
		
		const account = accounts[username];
		const mapId = account.plugins.Map.id;
		
		const pointA = this.getPositionsByCoordinates({
			posX: x,
			posY: y
		});
		if(mapId==pointA.id) return true;
		const pointB = this.mapPositions.get(mapId);
		
		// console.log(pointA)
		// console.log(pointB)
		logger.info("[Map plugin] Initiating movement to ["+pointA.posX+", "+pointA.posY+"]")
		let path = [];
		try {
			path = await this.World.getPath(pointA.id, pointB.id);
		} catch (error) {
			logger.error("[Map plugin] " + error);
		}
		
		path=path.map(a =>this.mapPositions.get(a))
		path.reverse()
		if (path) {
			console.log(
				JSON.stringify(
					path.map(a => {
						return [a.posX, a.posY];
					})
				)
			);
		}
		for (let i = 1; i < path.length; i++) {
			// await sleep(3000)
			// path[i]=this.mapPositions.get(path[i])
			
			const xAxis = path[i].posX - path[i - 1].posX;
			const yAxis = path[i].posY - path[i - 1].posY;
			let mapSide;

			if (xAxis != 0 && yAxis != 0) {
				logger.error(
					`[Map plugin] Cannot know wich direction to go from [${path[i - 1].posX}, ${path[i - 1].posY}] to [${path[i].posX}, ${path[i].posY}]`
				);
				return false;
			}
			if (xAxis != 0) {
				mapSide = xAxis == 1 ? "right" : "left";
			}
			if (yAxis != 0) {
				mapSide = yAxis == 1 ? "bottom" : "top";
			}
			logger.info("[Map plugin] Moving to ["+path[i].posX+", "+path[i].posY+"] ("+mapSide+")")
			try{
				await this.ChangeMapMessage(
					username,
					mapSide
				);
			}
			catch(error){
				console.log(error)
				logger.error(
					`[Map plugin] Something went wrong while trying to move to [${path[i].posX}, ${path[i].posY}]`
				);
				return false;
			
			}
		}
		return true;
	}

	async getMapIdsOfMapPositions() {
		const mapFileNames = fs
			.readdirSync("./src/Plugins/Map/storage/maps")
			.filter(m => m.includes(".bson"))
			.map(m => Number(m.replace(".bson", "")));

		const mapPositions = await gamedata.MapPositions.getMapPositions(
			mapFileNames
		);
		const mapIds = new Map();
		for (let mapPosition of mapPositions) {
			mapIds.set(
				JSON.stringify([
					mapPosition.posX,
					mapPosition.posY,
					mapPosition.hasPriorityOnWorldmap
				]),
				Number(mapPosition.id)
			);
		}
		return mapIds;
	}*/

	/**
	 * this.mapPositions is an array with a length of more than 10'000
	 * Using the fastest loop we can possibly make will increase the process of iteration
	 *
	 * @param {Object} point MapPositions
	 * @param {Number} xMod
	 * @param {Number} yMod
	 *
	 * @returns {Object|false} MapPositions
	 */
	/*getPositionsByCoordinates(point, xMod = 0, yMod = 0) {
		point.posX += xMod;
		point.posY += yMod;

		for (var i = 0, len = this.mapPositions.length; i < len; i++) {
			if (
				this.mapPositions[i].posX == point.posX &&
				this.mapPositions[i].posY == point.posY &&
				this.mapPositions[i].hasPriorityOnWorldmap == true
			) {
				return this.mapPositions[i];
			}
		}
		return false;
	}*/

	/**
	 * Get the compressed path taken by the player
	 *
	 * @param {String} username
	 * @param {Number} startCellId
	 * @param {Number} targetCellId
	 * @param {Boolean} allowDiagonals
	 * @param {Boolean} stopNextToTarget
	 *
	 * @returns {Array|false}
	 */
	getPath(
		username,
		startCellId,
		targetCellId,
		allowDiagonals = true,
		stopNextToTarget = false
	) {
		const account = accounts[username];
		let occupiedCells = Object.values(account.plugins.Map.actors).map(
			actor => actor.disposition.cellId
		);
		
		/*ANTI AGRO*/
		for(const contextualId in account.plugins.Map.actors){
			if(!account.plugins.Map.actors[contextualId].agro) continue;
			
			for(const cell of getNeighbourCells(account.plugins.Map.actors[contextualId].disposition.cellId, true)){
				sendToBrowser("AGRO", {
					username,
					cell
				})
				if(!occupiedCells.includes(cell)) occupiedCells.push(cell)
			}
			
		}
		
		let path = accounts[username].pathfinder.getPath(
			startCellId,
			targetCellId,
			occupiedCells,
			allowDiagonals,
			stopNextToTarget
		);
		return path;
	}

	/**
	 * Move to a specific cell id
	 *
	 * @param {String} username
	 * @param {Number} targetCellId
	 * @param {Boolean} stopNextToTarget
	 *
	 * @returns {Promise}
	 */
	GameMapMovementRequestMessage(
		username,
		targetCellId,
		stopNextToTarget = false
	) {
		const account = accounts[username];
		const connection = accounts[username].socket;
		const actor = accounts[username].plugins.Fighter.fighting ? account.plugins.Fighter.fighters[account.extra.selectedCharacter.id] : account.plugins.Map.actors[account.extra.selectedCharacter.id]
		const actorCellId = actor.disposition.cellId;

		return new Promise((resolve, reject) => {
			if (!["WAITING FOR PARTY", "IDLE", "FIGHTING"].includes(account.state)) {
				if(account.state == "MOVING") return resolve()
				sendToBrowser("LOG", {
					username, 
					html: `<p class='error'>Erreur lors du déplacement (Personnage occupé.)</p>`
				})
				return reject(new Error(`Couldn't move, player busy ${account.state}`));
			}
			
			accounts[username].pathfinder.direction = actor.disposition.direction;
			accounts[username].pathfinder.isRiding = (actor.isMounted || false);
			accounts[username].pathfinder.isFightMode = (accounts[username].plugins.Fighter.fighting);
			
			
			var path = this.getPath(
				username,
				actorCellId,
				targetCellId,
				!(accounts[username].plugins.Fighter.fighting),
				stopNextToTarget
			);
			if (!path || path.length < 1) {
				sendToBrowser("LOG", {
					username, 
					html: `<p class='error'>Erreur lors du déplacement, coincé dans la map (no path).</p>`
				})
				return reject(new Error("Cannot move, stuck on map"));
			}
			
			
			if(!accounts[username].plugins.Fighter.fighting) setState(username, "MOVING")
			if(path.length == 1){
				setState(username, accounts[username].plugins.Fighter.fighting ? "FIGHTING" : "IDLE")
				logger.info(`[${username}]` + " Map | I'm already on the cell")
				return resolve()
			}
			
			sendToBrowser('SET_PATH', {
				username,
				path
			})
			
			const coeff = (configs[username].speedhack && !accounts[username].plugins.Fighter.fighting) ? 10 : 1 
			const pathDuration = accounts[username].pathfinder.getPathDuration(path, account.plugins.Map.cells) / coeff;
			
			const originalPath = path; //debug purposes
			
			path=accounts[username].pathfinder.compressPath(path)
			
			if(!accounts[username].plugins.Fighter.fighting){
				const time = configs[username].speedhack ? "<span style='color:white;'>dis vitess</span>" : `<span style='color:white;'>${pathDuration}</span>ms`
				sendToBrowser("LOG", {
					username, 
					html: `<p class='info'>Temps de déplacement: ${time}.</p>`
				})
			}
			
			if(pathDuration!=0){
				connection.sendMessage("GameMapMovementRequestMessage", {
					keyMovements: path,
					mapId: account.plugins.Map.id
				});
				
				
				
				connection.eventEmitter.once("GameMapNoMovementMessage", ()=> {
					sendToBrowser("LOG", {
						username, 
						html: `<p class='error'>Erreur lors du déplacement, <i>GameMapNoMovementMessage</i>.</p>`
					})
					
					console.log("My cell:", actorCellId, "Target cell:", targetCellId, "Diagonals:", !accounts[username].plugins.Fighter.fighting, "Path:", originalPath)
					if(accounts[username].plugins.Fighter.fighting) plugins.Fighter.finishMyTurn(username)
					// reject(new Error("Error moving (GameMapNoMovementMessage)"))
					resolve(false)
					return;
				})
				
				setTimeout(() => {
						connection.eventEmitter.off("GameMapNoMovementMessage")
						if(!accounts[username].plugins.Fighter.fighting) this.GameMapMovementConfirmMessage(username);
						else setState(username, accounts[username].plugins.Fighter.fighting ? "FIGHTING" : "IDLE")
						// this.GameMapMovementConfirmMessage(username);
						resolve();
				}, pathDuration);
			}
		});
	}

	/**
	 * Makes a map change by specifying the side you want to go (also supports moveToCell)
	 *
	 * @param {String} username
	 * @param {String} mapSide left, right, top, bottom
	 * @param {Number} radius A random cellId picked inside a radius around the shortest cellId from a map side
	 *
	 * @returns {Boolean}
	 */
	async ChangeMapMessage(username, mapSide, radius, retry = 1) {
		
		const account = accounts[username];
		// console.log(account)
		if(account.state == "FIGHTING") return false;
		if(Object.keys(account.plugins.Map.actors).length==0){
			sendToBrowser("LOG", {
				username, 
				html: `<p class='error'>Map non encore chargée, nouvelle tentative en cours..</p>`
			})
			await sleep(2000)
			return await this.ChangeMapMessage(username, mapSide, radius)
		}
		if(!isNaN(parseInt(mapSide))){
			await this.moveToCell(username, parseInt(mapSide))
			return false;
		}
		
		if(mapSide.includes("zaap") || mapSide.includes("zaapi")){
			const zaapMatch = mapSide.match(/^zaap\((.*),(.*)\)/)
			if(zaapMatch) return useZaap(username, zaapMatch[1], zaapMatch[2])
			const zaapiMatch = mapSide.match(/^zaapi\((.*),(.*)\)/)
			if(zaapiMatch) return useZaap(username, zaapiMatch[1], zaapiMatch[2], true)
			
			throw new Error("La syntaxe "+mapSide+" n'est pas valide")
			return
		}
		
		var cell = null;
		if(mapSide.includes("-")){
			cell = mapSide.split("-")[1]
			mapSide = mapSide.split("-")[0]
		}
		mapSide = mapSide.toLowerCase();
		
		const neighbourId = account.plugins.Map[mapSide + "NeighbourId"];
		const connection = accounts[username].socket;
		return new Promise(async(resolve, reject) => {
			
			if (neighbourId) {
				const actor = account.plugins.Map.actors[account.extra.selectedCharacter.id]
				
				let cellId = cell || getRandomClosestMapChangeCells(
					accounts[username].pathfinder,
					account.plugins.Map.cells,
					accounts[username].plugins.Map.actors[account.extra.selectedCharacter.id].disposition.cellId,
					mapSide,
					radius
				);
				if (cellId) {
					var timeout = setTimeout(async ()=>{
						if(retry == 2){
							sendToBrowser("LOG", {
								username, 
								html: `<p class='error'>Pas de mouvement détecté après 10 secondes.</p>`
							})
							reject(new Error(`[${username}]` + ' Map | Movement timeout'))
						} else {
							logger.warn(`[${username}]` + ' Map | No movement detected after 10 seconds, retrying..')
							sendToBrowser("LOG", {
								username, 
								html: `<p class='error'>Pas de mouvement détecté après 10 secondes, nouvelle tentaive en cours..</p>`
							})
							
							try{
								const res = await this.ChangeMapMessage(username, mapSide, radius, retry+1)
								resolve(res)
							} catch(e){
								reject(e)
							}
						}
					}, 10000)
					
					try {
						await this.GameMapMovementRequestMessage(username, cellId);
					} catch (error) {
						logger.error(error.message)
						clearTimeout(timeout)
						reject(error)
					}
					connection.sendMessage("ChangeMapMessage", {
						mapId: neighbourId
					});
					connection.eventEmitter.once("MapComplementaryInformationsDataMessage", (payload) => {	
						clearTimeout(timeout)
						resolve(true);
					})
					
					
					
				} else{
					if(retry == 3){
						sendToBrowser("LOG", {
							username, 
							html: `<p class='error'>Aucune cellule trouvée pour se déplacer vers: ${mapSide}.`
						})
						reject(new Error(`[${username}]` + ' Map | No cell to move to the '+mapSide))
					} else {
						// logger.warn(`[${username}]` + ' Map | No cell to move to the '+mapSide+', retrying..')
						sendToBrowser("LOG", {
							username, 
							html: `<p class='error'>Aucune cellule trouvée pour se déplacer vers: ${mapSide}. Tentative N°${retry} en cours..`
						})
						await sleep(1000)
						try{
							const res = await this.ChangeMapMessage(username, mapSide, radius, retry+1)
							resolve(res)
						} catch(e){
							reject(e)
						}
					}
				}
			} else reject(new Error('La direction spécifiée '+mapSide+' est invalide.'));
		})
	}

	/**
	 * @private
	 * Sends a moving confirmation message
	 *
	 * @param {String} username
	 */
	GameMapMovementConfirmMessage(username) {
		const connection = accounts[username].socket;
		// console.log(connection)
		connection.sendMessage("GameMapMovementConfirmMessage");
		
		setState(username, accounts[username].plugins.Fighter.fighting ? "FIGHTING" : "IDLE")
		
	}
	
	async fight(username, min = 1, max = 8, forbidden = [], forced = [], regen = []) {
		const account = accounts[username];
		if(account.state != "IDLE") return;
		const actors = account.plugins.Map.actors
		const connection = accounts[username].socket;
		
		const res = await new Promise(async (resolve, reject)=>{

			for(const contextualId in actors){
				if(actors[contextualId]._type!="GameRolePlayGroupMonsterInformations"){
					continue;
				}
				
				const monsterList = [actors[contextualId].staticInfos.mainCreatureLightInfos.creatureGenericId, ...actors[contextualId].staticInfos.underlings.map(e => e = e.creatureGenericId)]

				const conditions = [
					monsterList.filter(e => forced.includes(e)).length == forced.length,
					monsterList.filter(e => forbidden.includes(e)).length == 0,
					monsterList.length <= max,
					monsterList.length >= min
				]
				if(conditions.indexOf(false) != -1) continue;
				
				const monsters = [actors[contextualId].staticInfos.mainCreatureLightInfos.staticInfos.nameId, ...actors[contextualId].staticInfos.underlings.map(e => e = e.staticInfos.nameId)].join(", ")
				var cellId = actors[contextualId].disposition.cellId
				const groupId = contextualId
				
				if(accounts[username].plugins.Fighter.stats.lifePoints/accounts[username].plugins.Fighter.stats.maxLifePoints < configs[username].minLP/100){
					
					
					var script;
					if(account.script.running){
						account.socket.eventEmitter.once("stopScript", resolve);
						script = true;
					}
					
					if(regen.length > 0){
						for(const id of regen){
							const items = account.inventory.items.filter(e => e.GID == id)
							if(items.length > 0){
								for(const item of items){
									if(item.type.type == 6) account.socket.sendMessage("ObjectUseMessage", {
										objectUID: item.UID
									})
								}
							}
							if(accounts[username].plugins.Fighter.stats.lifePoints/accounts[username].plugins.Fighter.stats.maxLifePoints > configs[username].minLP/100) break;
						}
					}
					
					plugins.Misc.sit(username);
					
					await new Promise(r => {
						connection.eventEmitter.once("ReadyToFight", r)
						// if(account.script.running) account.socket.eventEmitter.once("stopScript", r);
					})
					

					if(script && !account.script.running) return;
					
					if(!actors[contextualId] || actors[contextualId]._type!="GameRolePlayGroupMonsterInformations"){
						sendToBrowser("LOG", {
							username, 
							html: `<p class='error'>Le groupe trouvé n'est plus dans la map, recherche à nouveau.</p>`
						})
						resolve(await this.fight(username, min, max, forbidden, forced))
						return;
					}
				}

				sendToBrowser("LOG", {
					username, 
					html: `<p class='success'>Lancement du combat: <span class='info'>${monsters}</span>.</p>`
				})
				try {
					cellId = actors[contextualId].disposition.cellId;
					await this.GameMapMovementRequestMessage(username, cellId);
				} catch (error) {
					reject(error)
				}
				connection.sendMessage("GameRolePlayAttackMonsterRequestMessage", {
					monsterGroupId: groupId,
					
				})
				resolve(true)
				return;
			}
		
			sendToBrowser("LOG", {
				username, 
				html: `<p class='warn'>[${account.plugins.Map.pos.x},${account.plugins.Map.pos.y}]: Aucun combat valide n'est présent sur la map.</p>`
			})
			resolve(false)
			
		})
		
		const party = parties.find(party => party.leader == username)
		if(party){
			party.slaves.map(async function(slave){
				if(accounts[slave]){
					if(!Object.keys(accounts[slave].socket.eventEmitter.events).includes("fightFunctionOver")) await new Promise(r => connection.eventEmitter.once('plsFightFunctionState', r));
					accounts[slave].socket.eventEmitter.emit("fightFunctionOver", res)
				}
			})
		}
		return res
	}
	
	async gather(username, forbidden = [], forced = []){
		const account = accounts[username];
		if(account.state != "IDLE") return;
		const elements = account.plugins.Map.interactiveElements
		const connection = accounts[username].socket;
		
		var script;
		if(account.script.running){
			script = true;
		}
				
				
		var gathered;
		// return new Promise(async (resolve, reject)=>{
			forbidden = forbidden.map(function(e){
				return typeof e == "string" ? e.toLowerCase() : e;
			})
			forced = forced.map(function(e){
				return typeof e == "string" ? e.toLowerCase() : e;
			})
			
			const skills = [];
			for(const id in account.jobs){
				for(const skill of account.jobs[id].skills){
					if(!forbidden.includes(skill.id) 
						&& !forbidden.includes(skill.item.id)
						&& !forbidden.includes(skill.item.name.toLowerCase())
					){
						if(forced.length == 0
							|| (forced.includes(skill.id) || forced.includes(skill.item.id) || forced.includes(skill.item.name.toLowerCase()))
						) skills.push(skill.id)
					}
				}
			}
		
			for(const id in elements){
				const el = elements[id];
				for(const i in el.enabledSkills){
					const skill = el.enabledSkills[i];
					if(skills.includes(skill.skillId)){
						gathered = true;
						sendToBrowser("LOG", {
							username,
							html: `<p class='info'>[${account.plugins.Map.pos.x},${account.plugins.Map.pos.y}]: Récolte: <span style='color: white';>${el._name}</span></p>`
						});
						try{
							await this.useInteractiveElement(username, id, i)
						} catch(e){
							/*literaly rien hh*/
						}
						// if(script && !account.script.running) return gathered;
						return gathered;
					}
				}
			}
		// })
		// return gathered;
	}
}
