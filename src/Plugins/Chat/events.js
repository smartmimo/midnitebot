const colors={
	0: "white",
	5: "#FF00FF",
	6: "#a9a9a9",
	7: "#FFA500",
	8: "red",
	9: "#00FFFF",
	10: "green"
}
const names = require("../../Assets/chat.json");
const items = require("../../Assets/items.json");

module.exports = class Chat {
	constructor() {
		this.listeners = [
			this.ChatServerMessage,
			this.TextInformationMessage,
			this.ChatAdminServerMessage,
			this.ChatServerCopyMessage,
			this.GuildInvitedMessage,
			this.ChatErrorMessage,
			this.ChatServerWithObjectMessage
		];
	}
	
	ChatServerMessage(payload){
		const { socket, data } = payload;
		
		if(data.content == configs[socket.account.username].exchange.pass && configs[socket.account.username].exchange.enabled && !accounts[socket.account.username].plugins.Exchange.whitelisted.find(e => e.name == data.senderName)){
			accounts[socket.account.username].plugins.Exchange.whitelisted.push({name: data.senderName, id: data.senderId})
			sendToBrowser('LOG', {
				username: socket.account.username, 
				html: `<p class='info'>Le joueur <span style='color:white;'>${data.senderName}</span> peut maintenant lancer des échanges avec le bot.</p>`
			})
		}
		
		if(!configs[socket.account.username].enabledChannels.includes(data.channel)) return;
		
		const channelName = names[data.channel].nameId;
		// console.log(accounts[socket.account.username].extra.selectedCharacter.characterName, data.senderName)
		const bg = accounts[socket.account.username].extra.selectedCharacter.characterName == data.senderName ? "background-color:#ef476f; padding:0.5px 2px 0.5px 2px;" : ""
		sendToBrowser('LOG', {
			username: socket.account.username, 
			html: `<p><span style='color: ${colors[data.channel]};'>(${channelName})</span> <span style='color:white;'><span style='${bg}'>${data.senderName}</span>: </span><span style='color: ${colors[data.channel]};'>${data.content}</span></p>`
		})
	}
	
	ChatServerWithObjectMessage(payload){
		const { socket, data } = payload;
		
		if(!configs[socket.account.username].enabledChannels.includes(data.channel)) return;
		
		const channelName = names[data.channel].nameId;
		
		const bg = accounts[socket.account.username].extra.selectedCharacter.characterName == data.senderName ? "background-color:#ef476f; padding:0.5px 2px 0.5px 2px;" : ""

		for(const object of data.objects) data.content = data.content.replace("￼", `<b>[${items[object.objectGID].name}]</b>`)
		sendToBrowser('LOG', {
			username: socket.account.username, 
			html: `<p><span style='color: ${colors[data.channel]};'>(${channelName})</span> <span style='color:white;'><span style='${bg}'>${data.senderName}</span>: </span><span style='color: ${colors[data.channel]};'>${data.content}</span></p>`
		})
	}
	
	
	TextInformationMessage(payload){
		const {socket, data}=payload
		// myLogger.info("CLIENT: "+ '[31m'+data.text+'[0m')
		sendToBrowser('LOG', {
			username: socket.account.username, 
			html: `<p class='error'>${data.text}</p>`
		})
	}
	
	GuildInvitedMessage(payload){
		const {socket, data}=payload
		socket.sendMessage("GuildInvitationAnswerMessage", {accept: 0})
	}
	
	ChatAdminServerMessage(payload){
		const {socket, data} = payload;
		
		sendToBrowser('LOG', {
			username: socket.account.username, 
			html: `<p class='error'>(ALERTE) <b>${data.senderName}</b>: ${data.content}.</p>`
		})
		
		if(configs[socket.account.username].antimod){
			accounts[socket.account.username]["reason"] = "WAITING_FOR_MODERATOR";
			setTimeout(()=>socket.send("disconnecting", "CLIENT_CLOSING"), 1000);
		}
		
	}
	
	ChatServerCopyMessage(payload){
		const {socket, data} = payload;
		sendToBrowser('LOG', {
			username: socket.account.username, 
			html: `<p><span style='color: #00FFFF;'>(Privé)</span> <span style='color:white; background-color:#ef476f; padding:0.5px 2px 0.5px 2px;'><span style="color:#00FFFF !important;">à </span>${data.receiverName}</span><span style='color:white;'>:</span> <span style='color: #00FFFF;'>${data.content}</span></p>`
		})
	}
	
	ChatErrorMessage(payload){
		const {socket, data} = payload;
		sendToBrowser('LOG', {
			username: socket.account.username, 
			html: `<p class='error'>Erreur: ${data.reason}.</p>`
		})
	}
}