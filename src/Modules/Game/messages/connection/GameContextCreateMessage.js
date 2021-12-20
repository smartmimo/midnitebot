module.exports = function GameContextCreateMessage(payload) {
	const { socket } = payload;
	socket.sendMessage("ObjectAveragePricesGetMessage");
	
	socket.eventEmitter.once("ObjectAveragePricesMessage", async (p)=>{
		// await plugins.Shop.openSellShop(socket.account.username, false); 
		// plugins.Shop.closeShop(socket.account.username, false)
		accounts[socket.account.username].plugins.Shop["avg"] = {
			ids: p.data.ids,
			avgPrices: p.data.avgPrices
		}
	})
}
