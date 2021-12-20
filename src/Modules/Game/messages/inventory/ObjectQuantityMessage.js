const items = require("../../../../Assets/items.json");

function ObjectQuantityMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	
	
	
	const itemIndex = accounts[username]["inventory"].items.findIndex(e => e.UID == data.objectUID);
	
	accounts[username]["inventory"].items[itemIndex].quantity = data.quantity;

	if(items[accounts[username]["inventory"].items[itemIndex].GID].type.id == 100){
		accounts[data.username].socket.sendMessage("ObjectUseMessage", {
			objectUID: data.objectUID
		})
	}
	
	sendToBrowser("OBJECT_QUANTITY", {
		username,
		item: accounts[username]["inventory"].items[itemIndex]
	})
}

module.exports = ObjectQuantityMessage;