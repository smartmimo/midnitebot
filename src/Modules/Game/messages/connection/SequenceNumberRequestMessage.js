module.exports = function SequenceNumberRequestMessage(payload) {
	const { socket } = payload;
	const username = socket.account.username;
	const state = accounts[username];
	const currentSequenceNumber = state.currentSequenceNumber;
	socket.sendMessage("SequenceNumberMessage", {
		number: currentSequenceNumber + 1
	});

	accounts[username].currentSequenceNumber++;
}
