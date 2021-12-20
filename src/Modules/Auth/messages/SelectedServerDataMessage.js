function SelectedServerDataMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	const selectedServerData = {
		address: data.address,
		port: data.port,
		id: data.serverId,
		ticket: data.ticket,
		access: data._access
	};

	accounts[username]["auth"]["selectedServerData"] = selectedServerData
	setState(username, "SWITCHING TO GAME")
	
	socket.send("disconnecting", "SWITCHING_TO_GAME");
	socket.destroy();
}

module.exports = SelectedServerDataMessage;