function ObjectDeletedMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	
	// console.log(data)
	const itemIndex = accounts[username]["inventory"].items.findIndex(function(e){if(e) return e.UID == data.objectUID});
	
	sendToBrowser("LOG", {
		username,
		html: `<p class='warn'>L'objet ${accounts[username]["inventory"].items[itemIndex].name} est supprimé de l'inventaire.</p>`
	})
	
	delete global.accounts[username]["inventory"].items[itemIndex];

	
	sendToBrowser("OBJECT_QUANTITY", {
		username,
		item: null,
		UID: data.objectUID
	})
	
	
}

module.exports = ObjectDeletedMessage;