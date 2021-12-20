
module.exports = function AccountCapabilitiesMessage(payload) {
	const { socket } = payload;
	const username = socket.account.username;
	const state = accounts[username];

	let isSubscriber = false;
	if (Number(state.extra.subscribtionEndDate) > 0) isSubscriber = true;
	
	socket.send("kpiStartSession", {
		accountSessionId: state.extra.accountSessionId,
		isSubscriber
	});
	
}
