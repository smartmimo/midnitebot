module.exports = function HelloGameMessage(payload) {
	const { socket } = payload;
	const username = socket.account.username;
	const state = accounts[username];
	const ticket = state.auth.selectedServerData.ticket;

	socket.sendMessage("AuthenticationTicketMessage", {
		ticket,
		lang: "fr"
	});
	
	socket.eventEmitter.once("ObjectAveragePricesMessage", async (p)=>{
		await plugins.Shop.openSellShop(socket.account.username, false); 
		plugins.Shop.closeShop(socket.account.username, false)
	})
}
