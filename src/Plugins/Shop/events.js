const items = require("../../Assets/items.json");

module.exports = class Events {
	constructor() {
		this.listeners = [
			this.ExchangeStartedBidBuyerMessage,
			// this.ExchangeLeaveMessage,
			this.ExchangeStartedBidSellerMessage,
			this.ExchangeBidHouseItemRemoveOkMessage,
			
			this.ExchangeStartOkNpcShopMessage
		];
	}

	
	ExchangeStartedBidBuyerMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		accounts[username].plugins.Shop.buy.opened = true;

		sendToBrowser("LOG", {
			username,
			html: `<p class='warn'>HDV ouvert (Achat).</p>`
		})
	}
	
	ExchangeStartOkNpcShopMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		
		setState(username, "EXCHANGING");
		
		accounts[username].plugins.Shop.merchant = [];
		
		for(const item of data.objectsInfos){
			accounts[username].plugins.Shop.merchant.push({
				id: item.objectGID,
				price: item.objectPrice
			})
		}
		
		sendToBrowser("LOG", {
			username,
			html: `<p class='warn'>Mode marchand NPC: ${data.npcSellerId}. Devise: <span style='color:white;'>${items[data.tokenId].name}</span></p>`
		})
	}
	
	ExchangeStartedBidSellerMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		accounts[username].plugins.Shop.sell.opened = true;

		
		
		accounts[username].plugins.Shop.itemsOnSale = [];
		for(const object of data.objectsInfos){
			// if(accounts[username].plugins.Shop.itemsOnSale.find(e => e.UID == object.objectUID)) continue;
			accounts[username].plugins.Shop.itemsOnSale.push({
				id: object.objectGID,
				name: items[object.objectGID].name,
				UID: object.objectUID,
				price: object.objectPrice,
				quantity: object.quantity,
				expiration: object.unsoldDelay //hours
			})
			
			sendToBrowser("SHOP_UPDATE", {
				username,
				item: {
					name: items[object.objectGID].name,
					UID: object.objectUID,
					price: object.objectPrice,
					quantity: object.quantity,
					expiration: object.unsoldDelay //hours
				}
			})
		}
		
		accounts[username].plugins.Shop.maxSlots = data.sellerDescriptor.maxItemPerAccount;
	}
	
	ExchangeBidHouseItemRemoveOkMessage(payload){
		const {socket, data} = payload;
		const username = socket.account.username;
		global.accounts[username].plugins.Shop.itemsOnSale = accounts[username].plugins.Shop.itemsOnSale.filter(item => item.UID != data.sellerId)
		sendToBrowser("SHOP_UPDATE", {
			username,
			item: {
				UID: data.sellerId,
			}
		})
	}
	/*ExchangeLeaveMessage(payload){
		const username = payload.socket.account.username;
		if(accounts[username].plugins.Shop.buy.opened || accounts[username].plugins.Shop.sell.opened){
			accounts[username].plugins.Shop.buy.opened = false;
			accounts[username].plugins.Shop.sell.opened = false;
			sendToBrowser("LOG", {
				username,
				html: `<p class='warn'>HDV fermé.</p>`
			})
		}
	}*/

}
