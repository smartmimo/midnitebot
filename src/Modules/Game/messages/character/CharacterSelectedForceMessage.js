module.exports = function CharacterSelectedForceMessage(payload) {
	const { socket } = payload;
	const username = socket.account.username;

	socket.sendMessage("CharacterSelectedForceReadyMessage");

}
