
module.exports = class Misc{
	
	constructor() {
		
	}
	
	sit(username){
		if(accounts[username].state != "IDLE") return;
		accounts[username].socket.sendMessage("EmotePlayRequestMessage", {
			emoteId: 1
		})
		
		/*sendToBrowser("LOG", {
			username,
			html: `<p class='info'>Début de la génération de vie.</p>`
		})*/
	}
}
