const logger = require("../../Libs/Logger");
// const Events = require("./events");
const npcs = require("../../Assets/npcs.json");

module.exports = class Npc {
	constructor() {
		// super();
	}
	
	async talk(username, name, actionId = 3){
		const account = accounts[username];
		const npc = isNaN(parseInt(name)) ? await npcs.findIndex(function (e){if(e) return e.toLowerCase() == name.toLowerCase()}) : name;
		
		if(!npc || npc == -1){
			sendToBrowser("LOG", {
				username,
				html: `<p class='error'>${name} n'existe pas dans le monde.</p>`
			})
			return false;
		}
		
		var npcsInMap = {};
		for (const i in account.plugins.Map.actors) {
			const actor = account.plugins.Map.actors[i]
			// console.log(actor)
			if(actor.npcId) npcsInMap[actor.npcId] = actor
		}
		
		// console.log(npcsInMap)
		if(npcsInMap[npc]){
			try{
				if(actionId == 3) return await this.NpcGenericActionRequestMessage(username, npcsInMap[npc])
				
				account.socket.sendMessage("NpcGenericActionRequestMessage", {
					npcId: npcsInMap[npc].contextualId,
					npcActionId: actionId,
					npcMapId: account.plugins.Map.id
				})
				return;
			}
			catch(e){
				sendToBrowser("LOG", {
					username,
					html: `<p class='error'>NPC: ${e.message}.</p>`
				})
				return false;
			}
		}
		else{
			// logger.error("Npc not found in map")
			sendToBrowser("LOG", {
				username,
				html: `<p class='error'>${name} n'est pas dans la map.</p>`
			})
			
			var names = "";
			for(const i in npcsInMap) names += `, ${npcsInMap[i]["_npcData"].nameId}`
			sendToBrowser("LOG", {
				username,
				html: `<p class='warn'>NPCs dans la map: <span style='color: white;'>${names.slice(2)}</span>.</p>`
			})
			return false;
		}
	}
	
	
	async interact(username, name, actionId){
		return await this.talk(username, name, actionId);
	}
	
	
	async reply(username, index){
		const account = accounts[username];
		if(!account.plugins.Npc.currentDialog) return;
		if(account.plugins.Npc.currentReplies.length == 0) sendToBrowser("LOG", {username, html: "<p class='warn'>Le dialogue n'a pas de réponses. Considerez leave()</p>"})
		const reply = account.plugins.Npc.currentReplies[index];
		if(!reply) return;
		try{
			await this.NpcDialogReplyMessage(username, reply)
		}
		catch(e){
			logger.error(e)
		}
		
	}
	
	leave(username){
		const connection = accounts[username].socket;
		// return new Promise((resolve)=>{
			connection.sendMessage("LeaveDialogRequestMessage")
			setState(username, "IDLE")
			/*const interval = setTimeout(()=>connection.sendMessage("LeaveDialogRequestMessage"), 2000)
			connection.eventEmitter.once("LeaveDialogMessage", ()=>{
				accounts[username].plugins.Npc.currentDialog = false;
				clearTimeout(interval)
				resolve()
			})
		})*/
	}
	
	async npcBank(username){
		const talked = await this.talk(username, "Banquier");
		if(talked) await this.reply(username, 0)
		
		return talked;
	}
	
	NpcDialogReplyMessage(username, replyId){
		return new Promise((resolve, reject)=>{
			const connection = accounts[username].socket;
			connection.sendMessage("NpcDialogReplyMessage", {
				replyId
			})
			
			connection.eventEmitter.once("LeaveDialogMessage", ()=>{
				setState(username, "IDLE")
				global.accounts[username].plugins.Npc.currentDialog = null;
				resolve();
			})
			
			connection.eventEmitter.once("NpcDialogQuestionMessage", async (payload) =>{
				const data = payload.data
				
				global.accounts[username].plugins.Npc.currentReplies = data.visibleReplies;
				
				// const dialog = await gamedata.NpcMessages.getMessage(data.messageId)
				// console.log(`Dialogue: `, dialog[0].messageId)
				// console.log("Reponses: ", data.visibleReplies)
				resolve()
			})
		})
	}
	
	NpcGenericActionRequestMessage(username, npcData){
		const account = accounts[username];
		return new Promise((resolve, reject)=>{
			var id = setTimeout(()=>reject(new Error("Erreur en essayant de parler au Npc.")), 10000)
			const connection = accounts[username].socket;
			// console.log(npcData)
			
			connection.sendMessage("NpcGenericActionRequestMessage", {
				npcId: npcData.contextualId,
				npcActionId: 3,
				npcMapId: account.plugins.Map.id
			})
			
			connection.eventEmitter.once("NpcDialogCreationMessage", (payload) => {
				setState(username, "TALKING")
				global.accounts[username].plugins.Npc.currentDialog = {npcId: npcData.id, npcActionId: 3}
			})
			
			connection.eventEmitter.once("NpcDialogQuestionMessage", async (payload) =>{
				const data = payload.data
				accounts[username].plugins.Npc.currentReplies = data.visibleReplies;
				/*var replies={}
				for(var i in data.visibleReplies){
					var message=await gamedata.NpcMessages.getMessage(data.visibleReplies[i])
					replies[data.visibleReplies[i]]=message[0].messageId
				}*/
				// const dialog = await gamedata.NpcMessages.getMessage(data.messageId)
				// console.log(`${npcData.nameId}: `, dialog[0].messageId)
				// console.log("Reponses: ", data.visibleReplies)
				clearTimeout(id)
				resolve(true)
			})
		})
	}
	
}
