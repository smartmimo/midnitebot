//This file is read as string and put on the head of the script before it gets evaluated, keep it clean (it's weird talking to myself azabi hhhhhhhhhhh)

const log = {
	info: (html) => {
		if(typeof html == 'object') html = "<pre class='info'>" + JSON.stringify(html, null, 4) + "</pre>"
		sendToBrowser("LOG", {username, html: "<p class='info'>"+html+"</p>"})
	},
	warn: (html) =>{
		if(typeof html == 'object') html = "<pre class='warn'>" + JSON.stringify(html, null, 4) + "</pre>"
		sendToBrowser("LOG", {username, html: "<p class='warn'>"+html+"</p>"})
	},
	error: (html) => {
		if(typeof html == 'object') html = "<pre class='error'>" + JSON.stringify(html, null, 4) + "</pre>"
		sendToBrowser("LOG", {username, html: "<p class='error'>"+html+"</p>"})
	},
	success: (html) => {
		if(typeof html == 'object') html = "<pre class='success'>" + JSON.stringify(html, null, 4) + "</pre>"
		sendToBrowser("LOG", {username, html: "<p class='success'>"+html+"</p>"})
	}
}	

/**
CONSTANTS
**/
if(typeof MAX_MONSTERS == 'undefined')var MAX_MONSTERS = 8;
if(typeof MIN_MONSTERS == 'undefined') var MIN_MONSTERS = 1;
if(typeof FORCED_MONSTERS == 'undefined') var FORCED_MONSTERS = [];
if(typeof FORBIDDEN_MONSTERS == 'undefined') var FORBIDDEN_MONSTERS = [];
if(typeof FORCED_GATHERS == 'undefined') var FORCED_GATHERS = [];
if(typeof FORBIDDEN_GATHERS == 'undefined') var FORBIDDEN_GATHERS = [];
if(typeof BANK_WHITELIST == 'undefined') var BANK_WHITELIST = [];
if(typeof REGENERATE_ITEMS == 'undefined') var REGENERATE_ITEMS = [];
if(typeof AUTO_DELETE == 'undefined') var AUTO_DELETE = [];

this.maxMonsters = MAX_MONSTERS;
this.minMonsters = MIN_MONSTERS;
this.forcedMonsters = FORCED_MONSTERS;
this.forbiddenMonsters = FORBIDDEN_MONSTERS;
this.forcedGathers = FORCED_GATHERS;
this.forbiddenGathers = FORBIDDEN_GATHERS;
this.bankWhitelist = BANK_WHITELIST;
this.regenerateItems = REGENERATE_ITEMS;
this.autoDelete = AUTO_DELETE;


/**
FUNCTIONS
**/
function sleep(ms){
	return new Promise((resolve)=>setTimeout(resolve, ms))
}

//GLOBAL
const stopScript = ()=>{
	ws.emit("message", JSON.stringify({
		message: "STOP_SCRIPT",
		data: {
			username
		}
	}))
};
const disconnect = ()=>{
	accounts[username]["manual"] = {script: true, reconnect: false};
	accounts[username].socket.send("disconnecting", "CLIENT_CLOSING")
}
const reconnect = (ms)=>{
	accounts[username]["manual"] = {script: true, reconnect: ms};
	accounts[username].socket.send("disconnecting", "CLIENT_CLOSING")
	setTimeout(()=>{
		ws.emit("message", JSON.stringify({
			message: "LOGIN",
			data: {
				user: username
			}
		}))
	}, ms)
}

//CHARACTER
const characterId = () => accounts[username].extra.selectedCharacter.id;
const characterName = () => accounts[username].extra.selectedCharacter.characterName;
const characterLevel = () => accounts[username].extra.selectedCharacter.level;
const characterStats = function(){
	const stats = accounts[username].plugins.Fighter.stats;
	return {
		vitality: stats.vitality.alignGiftBonus + stats.vitality.base + stats.vitality.contextModif + stats.vitality.objectsAndMountBonus,
		wisdom: stats.wisdom.alignGiftBonus + stats.wisdom.base + stats.wisdom.contextModif + stats.wisdom.objectsAndMountBonus,
		strength: stats.strength.alignGiftBonus + stats.strength.base + stats.strength.contextModif + stats.strength.objectsAndMountBonus,
		intelligence: stats.intelligence.alignGiftBonus + stats.intelligence.base + stats.intelligence.contextModif + stats.intelligence.objectsAndMountBonus,
		chance: stats.chance.alignGiftBonus + stats.chance.base + stats.chance.contextModif + stats.chance.objectsAndMountBonus,
		agility: stats.agility.alignGiftBonus + stats.agility.base + stats.agility.contextModif + stats.agility.objectsAndMountBonus,
		lifePoints: stats.lifePoints,
		maxLifePoints: stats.maxLifePoints,
		lifePointsP: (stats.lifePoints*100/stats.maxLifePoints).toFixed(2),
		energyPoints: stats.energyPoints,
		experience: stats.experience - stats.experienceLevelFloor,
		experienceNextLevel: stats.experienceNextLevelFloor - stats.experienceLevelFloor,
		experienceP: ((stats.experience - stats.experienceLevelFloor)*100/(stats.experienceNextLevelFloor - stats.experienceLevelFloor)).toFixed(2),
		weight: accounts[username].inventory.weight.weight,
		maxWeight: accounts[username].inventory.weight.maxWeight,
		weightP: (accounts[username].inventory.maxWeight*100/accounts[username].inventory.maxWeight).toFixed(2)
	}
}
const characterKamas = () => accounts[username].inventory.kamas;
const characterBreed = () => accounts[username].extra.selectedCharacter.breed;
const characterServer = function(){return {id: accounts[username].auth.selectedServer.id, name: accounts[username].auth.selectedServer.name}};
const characterState = () => accounts[username].state;

//DATA
const characterJobs = function(){
	var ret = []
	for(const id in accounts[username].jobs){
		ret.push({
			id,
			name: accounts[username].jobs[id].name,
			level: accounts[username].jobs[id].level
		})
	}
	return ret;
}
// const getJobsName = () => Object.values(accounts[username].jobs).map(e => e.name)
const registeredMessages = () => Object.keys(this.registered);

//INVENTORY
const getItems = ()=> {
	return accounts[username].inventory.items.map(function(item){
		return {
			name: item.name,
			GID: item.GID,
			UID: item.UID,
			quantity: item.quantity,
			isEquipped: item.position <= 15,
			type: item.type.type
		}
	})
}
const useItem = (id) => {
	const item = accounts[username]["inventory"].items.find(e => e.GID == id || e.name == id);
	if(!item){
		log.error(`L'item <span style='color:white;'>${id}</span> n'est pas présent dans l'inventaire`)
		return false;
	}
	if(item.type.type != 6){
		log.error(`L'item <span style='color:white;'>${item.name}</span> n'est pas utilisable.`)
		return false;
	}
	
	accounts[username].socket.sendMessage("ObjectUseMessage", {
		objectUID: item.UID
	})
	return true;
}
const equipItem = (id) => {
	const equipements = [
		13, //dofus
		10, //chapeau
		2, //cac
		1, //amulette
		3, //anneau
		4, //ceinture
		5, //bottes
		11, //cape
		12, //familier
		7, //bouclier
		21 //monture
	]
	const typeToPosition = (id) => {
		const typeToPositionObject = {
			13: 9, //dofus
			10: 6, //chapeau
			2: 1, //cac
			1: 0, //amulette
			3: 2, //anneau
			4: 3, //ceinture
			5: 5, //bottes
			11: 7, //cape
			12: 8, //familier
			7: 15, //bouclier
			21: 16 //monture
		}
		var position;
		
		if(id == 3){
			position = typeToPositionObject[id] + ringOffset;
			ringOffset = (ringOffset + 2) % 4;
		}
		else if(id == 13){
			position = typeToPositionObject[id] + dofusOffset;
			dofusOffset = (dofusOffset + 1) % 6;
		} else position = typeToPositionObject[id];
		
		return position;
	};
	const item = accounts[username]["inventory"].items.find(e => e.GID == id || e.name == id);
	if(!item){
		log.error(`L'item <span style='color:white;'>${id}</span> n'est pas présent dans l'inventaire.`)
		return false;
	}
	if(!equipements.includes(item.type.type)){
		log.error(`L'item <span style='color:white;'>${item.name}</span> n'est pas equippable.`)
		return false;
		
	}
	accounts[username].socket.sendMessage("ObjectSetPositionMessage", {
		objectUID: item.UID,
		position: typeToPosition(item.type.type),
		quantity: 1
	})
	return true;
}
const unequipItem = (id) => {
	const item = accounts[username]["inventory"].items.find(e => e.GID == id || e.name == id);
	if(!item){
		log.error(`L'item <span style='color:white;'>${id}</span> n'est pas présent dans l'inventaire.`)
		return false
	}
	if(item.position > 15){
		log.error(`L'item <span style='color:white;'>${item.name}</span> n'est pas équipé.`)
		return false;
	}
	accounts[username].socket.sendMessage("ObjectSetPositionMessage", {
		objectUID: item.UID,
		position: 63,
		quantity: 1
	})
	return true;
}
const deleteItem = (id, qt = null) => {
	const item = accounts[username]["inventory"].items.find(e => e.GID == id || e.name == id);
	if(!item){
		log.error(`L'item <span style='color:white;'>${id}</span> n'est pas présent dans l'inventaire.`)
		return false;
	}
	accounts[username].socket.sendMessage("ObjectDeleteMessage", {
		objectUID: item.UID,
		quantity: qt || item.quantity
	})
	return true;
}


//DEVELOPER
const registerMessage = (msg, cb) => {
	if(this.registered[msg]){
		log.error(`Le bot écoute déjà le packet <span style='color:white;'>${msg}</span>, pour des raisons de performance on limite d'executer plus qu'un seul Callback en parallel lors du reçoi d'un message. Pour celà, au lieu d'utiliser registerMessage avec plusieurs Callback, veuillez utiliser un seul Callback qui traite tous ce que vous voulez faire.`)
		return;
	}
	this.registered[msg] = {cb: (p)=>cb(p.data)};
	accounts[username].socket.eventEmitter.on(msg, this.registered[msg].cb)
}
const unregisterMessage = (msg) => {
	if(!this.registered[msg]) return;
	accounts[username].socket.eventEmitter.off(msg, this.registered[msg].cb)
	delete this.registered[msg];
}
const sendMessage = (msg, data) => {
	accounts[username].socket.sendMessage(msg, data)
}
const send = (msg, data) => {
	accounts[username].socket.send(msg, data)
}



//MAP
const mapUsername = {
	moveToCell: (id) => plugins.Map.moveToCell(username, id),
	goToMap: (x, y) => plugins.Map.goToMap(username, x, y),
	useInteractiveElement: (elementId, skillName) => plugins.Map.useInteractiveElement(username, elementId, skillName),
	followPath: (sides) => plugins.Map.followPath(username, sides),
	moveToSide: (side) => plugins.Map.moveToSide(username, side),
	freeSoul: () => plugins.Map.freeSoul(username),
	useZaap: (x, y) => plugins.Map.useZaap(username, x, y),
	useZaapi: (x, y) => plugins.Map.useZaap(username, x, y, true),
	saveZaap: () => plugins.Map.saveZaap(username),
	fight: (min = MIN_MONSTERS, max = MAX_MONSTERS, forbidden = FORBIDDEN_MONSTERS, forced = FORCED_MONSTERS) => plugins.Map.fight(username, min, max, forbidden, forced)
}
const {moveToCell, goToMap, useInteractiveElement, followPath, moveToSide, freeSoul, useZaap, useZaapi, saveZaap, fight} = mapUsername
const usePhoenix = () => useInteractiveElement(463535);
const currentCell = () => accounts[username].plugins.Map.actors[characterId()].disposition.cellId;
const onCell = (id) => currentCell() == id;
const onMap = function(id){
	const map = id.toString().trim().replace(/\s/g, "").replace(/\r\n/g, "\r").replace(/\n/g, "\r")
	return (id.toString() == accounts[username].plugins.Map.id.toString() || map == `${accounts[username].plugins.Map.pos.x},${accounts[username].plugins.Map.pos.y}`)
}
const currentMapId = () => accounts[username].plugins.Map.id
const currentMapCoords = () => `${accounts[username].plugins.Map.pos.x},${accounts[username].plugins.Map.pos.y}`
const currentArea = () => accounts[username].plugins.Map.area
const currentSubArea = () => accounts[username].plugins.Map.subArea
const playersOnMap = function(){
	var players = [];
	for(const id in accounts[username].plugins.Map.actors){
		const actor = accounts[username].plugins.Map.actors[id];
		if(actor._type == "GameRolePlayCharacterInformations") players.push(actor)
	}
	return players;
}
const monstersOnMap = function(){
	var players = [];
	for(const id in accounts[username].plugins.Map.actors){
		const actor = accounts[username].plugins.Map.actors[id];
		if(actor._type == "GameRolePlayGroupMonsterInformations") players.push(actor)
	}
	return players;
}
const playerCount = () => playersOnMap().length
const isActorOnMap = (id) => typeof accounts[username].plugins.Map.actors[id] != "undefined"
const getActorOnMap = (id) => accounts[username].plugins.Map.actors[id]
const getInteractive = () => accounts[username].plugins.Map.interactiveElements;
//NPC
const npcUsername = {
	talk: (name) => plugins.Npc.talk(username, name),
	reply: (index) => plugins.Npc.reply(username, index),
	leave: () => plugins.Npc.leave(username),
	interact: (name, id) => plugins.Npc.interact(username, name, id),
	npcBank: () => plugins.Npc.npcBank(username)
}
const {talk, reply, leave, npcBank, interact} = npcUsername

//SHOP
const shopUsername = {
	openBuyShop: () => plugins.Shop.openBuyShop(username),
	openSellShop: () => plugins.Shop.openSellShop(username),
	buy: (itemId, lot, priceMax, closeWhenOver = true) => plugins.Shop.buy(username, itemId, lot, priceMax, closeWhenOver, false),
	sell: (itemId, lot, price, closeWhenOver = true) => plugins.Shop.sell(username, itemId, lot, price, closeWhenOver),
	closeShop: () => plugins.Shop.closeShop(username),
	removeFromSale: (UID, edit = false) => plugins.Shop.removeFromSale(username, UID, edit),
	buyNpc: (id, qt = 1) => plugins.Shop.buyNpc(username, id, qt),
	sellNpc: (id, qt = 1) => plugins.Shop.sellNpc(username, id, qt),
}
const {openBuyShop, openSellShop, buy, sell, closeShop, removeFromSale, buyNpc, sellNpc} = shopUsername
const getPriceItem = async function(id, lot){
	if(!accounts[username].plugins.Shop.buy.opened) await openBuyShop()
	return await plugins.Shop.buy(username, id, lot, 1000000000, true, true)
}
const getAveragePriceItem = function(id, lot){
	const coeff = [1, 10, 100]
	
	const i = accounts[username].plugins.Shop.avg.ids.findIndex(e => e == id);
	if(i == -1){
		log.error(`L'item ${id} n'a pas été trouvé.`)
		return false;
	}
	return accounts[username].plugins.Shop.avg.avgPrices[i]*coeff[lot] || false;
	
	
}
const getItemsOnSale = () => accounts[username].plugins.Shop.itemsOnSale;
const editPrice = async function(UID, price, closeWhenOver = true){
	const item = accounts[username].plugins.Shop.itemsOnSale.find(e => e.UID == UID);
	if(!item) return sendToBrowser("LOG", {username, html: `<p class='error'>Aucun item de UID ${UID} n'est en vente. (Utilisez getItemsOnSale() pour lister tout les objets en vente avec leurs UID.)`})
	if(await removeFromSale(item.UID, false)) return await sell(item.id, {1: 0, 10: 1, 100: 2}[item.quantity], price, closeWhenOver)
	
}
const updateAllItems = async function(closeWhenOver = true){
	for(const item of getItemsOnSale()){
		await editPrice(item.UID, -1, false)
	}
	if(closeWhenOver) closeShop()
}
const availableSpace = ()=>accounts[username].plugins.Shop.maxSlots - accounts[username].plugins.Shop.itemsOnSale.length

//EXCHANGE
const exchangeUsername = {
	exchangeRequest: (name) => plugins.Exchange.exchangeRequest(username, name),
	sendObject: (id, qt) => plugins.Exchange.sendObject(username, id, qt),
	takeObject: (id, qt) => plugins.Exchange.takeObject(username, id, qt),
	sendKamas: (qt) => plugins.Exchange.sendKamas(username, qt),
	takeKamas: (qt) => plugins.Exchange.takeKamas(username, qt),
	cancelExchange: () => plugins.Exchange.cancelExchange(username),
	validateExchange: () => plugins.Exchange.validateExchange(username),
	/*BANK*/
	sendAllObjects: (whitelist) => plugins.Exchange.giveAllObjects(username, whitelist),
	takeAllObjects: () => plugins.Exchange.takeAllObjects(username),
	leaveBank: () => plugins.Exchange.cancelExchange(username)
}
const {exchangeRequest, sendObject, takeObject, sendKamas, takeKamas, cancelExchange, validateExchange, sendAllObjects, takeAllObjects, leaveBank} = exchangeUsername
const itemsInExchange = function(){		
	if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})	
	return accounts[username].plugins.Exchange.currentExchange.receiver.objects;
}
const kamasInExchange = function(){		
	if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})
	return accounts[username].plugins.Exchange.currentExchange.receiver.kamas;			
}
const itemsInStorage = function(){		
	if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})
	return accounts[username].plugins.Exchange.currentExchange.bot.objects;
}
const kamasInStorage = function(){		
	if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})		
	return accounts[username].plugins.Exchange.currentExchange.bot.kamas;			
}
const storageItemQuantity = function(id){		
	if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})	
	const item = accounts[username].plugins.Exchange.currentExchange.bot.objects.find(e => e.GID == id) || {quantity: 0}
	return item.quantity;
}
	
//CHAT
const chatUsername = {
	privateMessage: (content, receiver) => plugins.Chat.privateMessage(username, content, receiver),
	sendChat: (content) => plugins.Chat.general(accounts[username].socket, content)
}
const {privateMessage, sendChat} = chatUsername;

//MISC
const account = function(user){
	const acc = accounts[user || username]
	return {
		nickname: acc.extra.nickname,
		subscribtionEndDate: acc.extra.subscribtionEndDate,
		server: {id: acc.auth.selectedServer.id, name: acc.auth.selectedServer.name},
		character: acc.extra.selectedCharacter,
		socket: acc.socket,
		inventory: acc.inventory,
		jobs: acc.jobs,
		script: {
			name: acc.script.name,
			running: acc.script.running || false
		},
		map: acc.plugins.Map,
		shop: acc.plugins.Shop,
		exchange: acc.plugins.Exchange,
		pathfinder: acc.pathfinder,
		config: configs[user || username]
	}
}
const getLoadedAccounts = function(){
	const ret = {}
	for(const u of usernames){
		const acc = accounts[u]
		ret[u] = {
			online: acc ? true : false,
			execute: function(code){
				ws.emit("message", JSON.stringify({
					message: "LIVE_SCRIPT",
					data: {
						username: u,
						code
					}
				}))
			}
		}
		
		if(acc){
			ret[u] = {
				...ret[u],
				...account(u)
			}
		}
	}
	return ret
}