module.exports = function TrustStatusMessage(payload) {
	const { socket } = payload;
	socket.sendMessage("CharactersListRequestMessage");
}
