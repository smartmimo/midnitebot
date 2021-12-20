

module.exports = function CurrentMapMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	const mapId = data.mapId;
	
	accounts[username].plugins.Map.id = mapId;
	// socket.sendMessage("MapInformationsRequestMessage", { mapId });
}
