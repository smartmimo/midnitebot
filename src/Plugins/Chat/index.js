const Events = require("./events");
const names = require("../../Assets/chat.json");

module.exports = class Chat extends Events {
	
	constructor() {
		super();
		
	}
	
	general(socket, content){
		// return console.log("zab")
		const shortcut = content.split(" ")[0];
		
		const channel = names.find(e => shortcut == e.shortcut) || {id: 0};
		
		if(channel.id != 0) content = content.split(" ").slice(1).join(" ");
		if(channel.id == 9){
			return socket.sendMessage("ChatClientPrivateMessage", {
				content: content.split(" ").slice(1).join(" "),
				receiver: content.split(" ")[0]
			});	
		}
		
		socket.sendMessage("ChatClientMultiMessage", {
			content,
			channel: channel.id
		});	
	}
	
	privateMessage(username, content, receiver){
		const socket = accounts[username].socket;
		socket.sendMessage("ChatClientPrivateMessage", {
			content,
			receiver
		});	
	}
}
