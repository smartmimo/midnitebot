// const items = require("../../../Assets/items.json");

function ObjectMovementMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	


	const item  = accounts[username]["inventory"]["items"].find(e => e.UID == data.objectUID);
	
	if(!item) return sendToBrowser("LOG", {
		username,
		html: `<p class='WARN'>WARNING: L'item ${data.objectUID} a déclenché le packet <b>ObjectMovementMessage</b> mais est introuvable dans l'inventaire.</p>`
	})
			
	const oldPosition = item.position;
	item.position = data.position;
	
	sendToBrowser("OBJECT_MOVEMENT", {
		username,
		oldPosition,
		UID: data.objectUID,
		items: accounts[username]["inventory"]["items"]
	})
}

module.exports = ObjectMovementMessage;