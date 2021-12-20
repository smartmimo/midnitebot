const Events = require("./events");
const items = require("../../Assets/items.json");

function format(n){
	return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
}

module.exports = class Shop extends Events {
	constructor() {
		super();
		// console.log(accounts[username].pathfinder)
	}
	
	openBuyShop(username){
		if(accounts[username].plugins.Shop.sell.opened) this.closeShop(username)
		return new Promise((resolve, reject)=>{
			if(accounts[username].plugins.Shop.buy.opened) return resolve()
			const socket = accounts[username].socket;

			socket.sendMessage("NpcGenericActionRequestMessage", {
				npcId: 0,
				npcActionId: 6,
				npcMapId: accounts[username].plugins.Map.id
			})
			
			socket.eventEmitter.once("ExchangeStartedBidBuyerMessage", (payload)=>{
				clearTimeout(timeout)
				resolve(true)
			})
			socket.eventEmitter.once("ExchangeErrorMessage", (payload)=>{
				clearTimeout(timeout)
				sendToBrowser("LOG", {
					username,
					html: "<p class='error'>L'ouverture de l'HDV a échoué</p>"
				})
				resolve(false);
			})
			const timeout = setTimeout(()=>{
				
				sendToBrowser("LOG", {
					username,
					html: "<p class='error'>L'ouverture de l'HDV a échoué</p>"
				})
				resolve(false);
			}, 10000)
		})
	}
	
	openSellShop(username, log = true){
		if(accounts[username].plugins.Shop.buy.opened) this.closeShop(username)
		return new Promise((resolve, reject)=>{
			if(accounts[username].plugins.Shop.sell.opened) return resolve()
			const socket = accounts[username].socket;

			socket.sendMessage("NpcGenericActionRequestMessage", {
				npcId: 0,
				npcActionId: 5,
				npcMapId: accounts[username].plugins.Map.id
			})
			
			socket.eventEmitter.once("ExchangeStartedBidSellerMessage", (payload)=>{
				if(log) sendToBrowser("LOG", {
					username,
					html: `<p class='warn'>HDV ouvert (Vente).</p>`
				})
				clearTimeout(timeout)
				resolve(true)
			})
			socket.eventEmitter.once("ExchangeErrorMessage", (payload)=>{
				clearTimeout(timeout)
				sendToBrowser("LOG", {
					username,
					html: "<p class='error'>L'ouverture de l'HDV a échoué</p>"
				})
				resolve(false);
			})
			
			const timeout = setTimeout(()=>{
				
				sendToBrowser("LOG", {
					username,
					html: "<p class='error'>L'ouverture de l'HDV a échoué</p>"
				})
				resolve(false);
			}, 10000)
		})
	}
	
	closeShop(username, log = true){
		if(accounts[username].plugins.Shop.buy.opened || accounts[username].plugins.Shop.sell.opened){
			accounts[username].socket.sendMessage("LeaveDialogRequestMessage")
			accounts[username].socket.eventEmitter.once("ExchangeLeaveMessage", (p)=>{
				const username = p.socket.account.username;
				if(accounts[username].plugins.Shop.buy.opened || accounts[username].plugins.Shop.sell.opened){
					accounts[username].plugins.Shop.buy.opened = false;
					accounts[username].plugins.Shop.sell.opened = false;
					if(log) sendToBrowser("LOG", {
						username,
						html: `<p class='warn'>HDV fermé.</p>`
					})
				}
			})
		}
	}

	async buy(username, itemId, lot, priceMax, closeWhenOver = true, justPrice = false){
		var res;
		try{
			if(![0, 1, 2].includes(lot)) throw new Error(`Le lot ${lot} est invalide, valeurs attendus: 0, 1, 2`)
			if(!accounts[username].plugins.Shop.buy.opened) await this.openBuyShop(username)
			if(!accounts[username].plugins.Shop.buy.opened) return;
			
			if(!priceMax || priceMax == -1) priceMax = 10000000000; 
			res = await new Promise((resolve, reject)=>{
				const timeout = setTimeout(()=>reject(new Error("Timeout de 1 minute..")), 60000)
				
				const socket = accounts[username].socket;
				const itemData = items[itemId];
				
				if(!itemData) return reject(new Error("ID invalide, l'objet n'existe pas dans le monde de Dofus Touch."))
				socket.sendMessage("ExchangeBidHouseTypeMessage", {
					type: itemData.type.id
				})
				
				socket.eventEmitter.once("ExchangeTypesExchangerDescriptionForUserMessage", (payload) => {
					socket.sendMessage("ExchangeBidHouseListMessage", {
						id: itemId
					})
					
					socket.eventEmitter.once("ExchangeTypesItemsExchangerDescriptionForUserMessage", (payload) => {
						const {socket, data} = payload;
						
						if(data.itemTypeDescriptions.length == 0) {
							sendToBrowser("LOG", {
								username,
								html: `<p class='error'>L'objet <b>${itemData.name}</b> n'a pas été trouvé dans l'HDV.</p>`
							})
							clearTimeout(timeout)
							return resolve()
						}
						const objectToBuy = data.itemTypeDescriptions.filter(e => e.prices[lot] != 0).sort(function(a, b) {
							return a.prices[lot] - b.prices[lot];
						})[0];
						
						const minPrice = objectToBuy.prices[lot]
						// console.log(minPrice)
						if(justPrice){
							resolve(minPrice)
							return 
						}
						if(minPrice > priceMax){
							sendToBrowser("LOG", {
								username,
								html: `<p class='error'>L'objet <b>${itemData.name}</b> n'a pas pu être acheté, le prix minimal dans l'HDV ${format(minPrice)}K est plus grand que ${format(priceMax)}K.</p>`
							})
							clearTimeout(timeout)
							return resolve(false)
						}
						
						sendToBrowser("LOG", {
							username,
							html: `<p class='info'>On achete <b>${itemData.name}</b> pour ${format(minPrice)}K..</p>`
						})
						
						socket.sendMessage("ExchangeBidHouseBuyMessage", {
							uid: objectToBuy.objectUID,
							qty: [1, 10, 100][lot],
							price: minPrice
						})
						socket.eventEmitter.once("ExchangeBidHouseBuyResultMessage", (payload) => {
							const { socket, data } = payload;
							const username = socket.account.username;
							
							clearTimeout(timeout)
							if(data.bought){
								sendToBrowser("LOG", {
									username,
									html: `<p class='success'><span style='color:white;'>${[1, 10, 100][lot]}x</span> <b>${itemData.name}</b> acheté(s).</p>`
								})
								resolve(true)
							} else {
								sendToBrowser("LOG", {
									username,
									html: `<p class='error'>L'objet <b>${itemData.name}</b> n'a pas pu être acheté.</p>`
								})
								resolve(false)
							}
						})
					})
				})
			})
			
			
		} catch(e){
			sendToBrowser("LOG", {
				username,
				html: `<p class='error'>Erreur lors de l'achat de <b>${items[itemId] ? items[itemId].name : itemId}</b>: ${e.message}.</p>`
			})
			
			if(closeWhenOver) this.closeShop(username)
			return false;
		}
		
		if(closeWhenOver) this.closeShop(username)
		return res;
	}
	
	
	async sell(username, itemId, lot, price = -1, closeWhenOver = true){
		const itemData = accounts[username].inventory.items.find(e => e.GID == itemId);
		
		try{
			if(![0, 1, 2].includes(lot)) throw new Error(`Le lot ${lot} est invalide, valeurs attendus: 0, 1, 2`)

			if(!itemData) throw new Error(`Le lot n'est pas présent dans l'inventaire`)
				
			if(!accounts[username].plugins.Shop.sell.opened) await this.openSellShop(username)
			if(!accounts[username].plugins.Shop.sell.opened) return false;
			
			await new Promise((resolve, reject)=>{
				const timeout = setTimeout(()=>reject(new Error("Timeout de 1 minute..")), 60000)
				
				const socket = accounts[username].socket;
				
				socket.sendMessage("ExchangeBidHouseListMessage", {
					id: itemId
				})
				socket.eventEmitter.once("ExchangeBidhouseMinimumItemPriceListMessage", (payload) => {
					const {socket, data} = payload;
					if(data.prices[lot] != 0){
						sendToBrowser("LOG", {
							username,
							html: `<p class='info'>Le lot de <span style='color:white;'>x${[1, 10, 100][lot]}</span> <b>${itemData.name}</b> est en vente pour un prix minimal de ${format(data.prices[lot])}K.</p>`
						})
						if(!price) price = -1
						if(price == -1){
							if(!accounts[username].plugins.Shop.itemsOnSale.find(item => item.price == data.prices[lot])) price = data.prices[lot] - 1 > 0 ? data.prices[lot] - 1 : 1
							else price = data.prices[lot]
						}
					} else {
						sendToBrowser("LOG", {
							username,
							html: `<p class='info'>Le lot de <span style='color:white;'>x${[1, 10, 100][lot]}</span> <b>${itemData.name}</b> n'est pas en vente actuellement.</p>`
						})
						
						if(price == -1) price = 1;
					}

					socket.sendMessage("ExchangeObjectMovePricedMessage", {
						objectUID: itemData.UID,
						price,
						quantity: [1, 10, 100][lot]
					})
					
					socket.eventEmitter.once("ExchangeBidHouseItemAddOkMessage", (payload)=>{
						sendToBrowser("LOG", {
							username,
							html: `<p class='info'>Le lot de <span style='color:white;'>x${[1, 10, 100][lot]}</span> <b>${itemData.name}</b> a été mis en vente pout ${format(price)}K.</p>`
						})
						
						// console.log(payload.data);
						accounts[username].plugins.Shop.itemsOnSale.push({
							id: itemId,
							name: itemData.name,
							UID: payload.data.itemInfo.objectUID,
							price: payload.data.itemInfo.objectPrice,
							quantity: payload.data.itemInfo.quantity,
							expiration: payload.data.itemInfo.unsoldDelay
						})
						
						sendToBrowser("SHOP_UPDATE", {
							username,
							item: {
								name: itemData.name,
								UID: payload.data.itemInfo.objectUID,
								price: payload.data.itemInfo.objectPrice,
								quantity: payload.data.itemInfo.quantity,
								expiration: payload.data.itemInfo.unsoldDelay
							}
						})
						clearTimeout(timeout)
						resolve();
					})
				})
			})
		} catch(e){
			sendToBrowser("LOG", {
				username,
				html: `<p class='error'>Erreur lors de la vente de <b>${items[itemId] ? items[itemId].name : itemId}</b>: ${e.message}.</p>`
			})
			
			if(closeWhenOver) this.closeShop(username)
			
			return;
		}
		
		if(closeWhenOver) this.closeShop(username)
		return;
	}
	
	async removeFromSale(username, UID, closeWhenOver = true){
		if(!accounts[username].plugins.Shop.sell.opened) await this.openSellShop(username)
		if(!accounts[username].plugins.Shop.sell.opened) return false;
	
		const item = accounts[username].plugins.Shop.itemsOnSale.find(e => e.UID == UID);
		if(!item) return sendToBrowser("LOG", {username, html: `<p class='error'>Aucun item de UID ${UID} n'est en vente. (Utilisez getItemsOnSale() pour lister tout les objets en vente avec leurs UID.)`})
		const res = await new Promise(r => {
			const id = setTimeout(()=>{
				sendToBrowser("LOG", {username, html: `<p class='error'>RemoveFromSale: TIMEOUT`})
				r(false)
			}, 10000)
			accounts[username].socket.eventEmitter.once("ExchangeBidHouseItemRemoveOkMessage", p =>{
				clearTimeout(id)
				r(true)
			})
			accounts[username].socket.sendMessage("ExchangeObjectMoveMessage", {
				objectUID: UID,
				price: item.price,
				quantity: -item.quantity
			})
		})
		
		if(closeWhenOver) this.closeShop(username)
		return res;
	}
	
	buyNpc(username, id, qt = 1){
		if(!accounts[username].plugins.Shop.merchant) return sendToBrowser("LOG", {username, html: `<p class='error'>Vous n'êtes pas en mode "commerce avec npc".`})
		const item = accounts[username].plugins.Shop.merchant.find(e => e.id == id);
		if(!item) return sendToBrowser("LOG", {username, html: `<p class='error'>L'item ${id} n'est pas en vente.</p>`})
			
		accounts[username].socket.sendMessage("ExchangeBuyMessage", {
			objectToBuyId: id,
			quantity: qt
		})
		return true;
	}
	
	sellNpc(username, id, qt = 1){
		if(!accounts[username].plugins.Shop.merchant) return sendToBrowser("LOG", {username, html: `<p class='error'>Vous n'êtes pas en mode "commerce avec npc".`})
		const item = accounts[username].inventory.items.find(e => e.GID == id);
		if(!item) return sendToBrowser("LOG", {username, html: `<p class='error'>L'item ${id} n'est pas dans votre inventaire.</p>`})
		if(item.quantity < qt) return sendToBrowser("LOG", {username, html: `<p class='error'>Vous ne possedez pas la quantité désirée.</p>`})
			
		accounts[username].socket.sendMessage("ExchangeSellMessage", {
			objectToSellId: id,
			quantity: qt
		})
		
		return true;
	}
}


/*
send: {"call":"sendMessage","data":{"type":"ExchangeBidHouseTypeMessage","data":{"type":9}}}  //get all type 9 (anneaux)
send: {"call":"sendMessage","data":{"type":"ExchangeBidHouseListMessage","data":{"id":849}}} //get 849 for sale (anneau forceque)
> {"_messageType":"ExchangeTypesItemsExchangerDescriptionForUserMessage","itemTypeDescriptions":[{"_type":"BidExchangerObjectInfo","objectUID":1095036,"effects":[{"_type":"ObjectEffectInteger","actionId":118,"value":3}],"prices":[5,200,0]},{"_type":"BidExchangerObjectInfo","objectUID":1095090,"effects":[{"_type":"ObjectEffectInteger","actionId":118,"value":4}],"prices":[250,200,0]},{"_type":"BidExchangerObjectInfo","objectUID":1095144,"effects":[{"_type":"ObjectEffectInteger","actionId":118,"value":5}],"prices":[4,200,0]},{"_type":"BidExchangerObjectInfo","objectUID":1095158,"effects":[{"_type":"ObjectEffectInteger","actionId":118,"value":15}],"prices":[3333,0,0]},{"_type":"BidExchangerObjectInfo","objectUID":1095177,"effects":[{"_type":"ObjectEffectInteger","actionId":125,"value":27}],"prices":[2000,0,0]}],"_isInitialized":true}

send: {"call":"sendMessage","data":{"type":"ExchangeBidHouseBuyMessage","data":{"uid":1095036,"qty":1,"price":5}}}
> {"_messageType":"ExchangeBidHouseBuyResultMessage","uid":1095036,"bought":true,"_isInitialized":true}

*/