const Events = require("./events");
const items = require("../../Assets/items.json");

function format(n){
	return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
}

function sleep(ms){
	return new Promise((resolve)=>setTimeout(resolve, ms))
}

module.exports = class Chat extends Events {
	
	constructor() {
		super();	
	}
	
	async exchangeRequest(username, name){
		const socket = accounts[username].socket;
		const target = Object.keys(accounts[username].plugins.Map.actors).find(e => accounts[username].plugins.Map.actors[e].name == name || e == name)
		if(target){
			return await new Promise((resolve, reject) => {
				socket.sendMessage("ExchangePlayerRequestMessage", {
					exchangeType: 1,
					target
				});
				
				socket.eventEmitter.once("ExchangeRequestedTradeMessage", (p)=>{
					if(p.data.source == accounts[username].extra.selectedCharacter.id){
						sendToBrowser("LOG", {username, html: `<p class='info'>Demande d'échange envoyée à <span style='color:white;'>${name}</span>, on attends qu'il nous réponds..</p>`})
					}
					socket.eventEmitter.off("ExchangeErrorMessage")
					
					socket.eventEmitter.once("ExchangeLeaveMessage", (p)=>{
						socket.eventEmitter.off("ExchangeStartedWithPodsMessage")
						resolve(false);
					})
					
					socket.eventEmitter.once("ExchangeStartedWithPodsMessage", (p)=>{
						sendToBrowser("LOG", {
							username,
							html: `<p class='info'>Echange en cours avec <span style='color:white;'>${name}</span></p>`
						})
						socket.eventEmitter.off("ExchangeLeaveMessage")
						resolve(true)
					})
				})
				
				socket.eventEmitter.once("ExchangeErrorMessage", (p)=>{
					sendToBrowser("LOG", {username, html: `<p class='error'>La demande d'echange n'a pas pu être envoyée.</p>`})
					socket.eventEmitter.off("ExchangeRequestedTradeMessage")
					resolve(false)
				})
			})
		} else {
			sendToBrowser("LOG", {username, html: `<p class='error'>Le joueur <span style='color:white;'>${name}</span> n'est pas présent dans la map.</p>`})
			return false;
		}
	}
	
	
	async sendObject(username, id, qt = -1){
		const socket = accounts[username].socket;
		
		if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})
		
		const itemData = items[id];
		if(!itemData) return sendToBrowser("LOG", {username, html: `<p class='error'>ID invalide, <b>${id}</b> n'existe pas dans le monde de Dofus Touch.</p>`})
		
		const item = accounts[username].inventory.items.find(e => e.GID == id);
		if(!item) return sendToBrowser("LOG", {username, html: `<p class='error'>Vous ne possedez pas <span style='color:white;'>${itemData.name}</span>.</p>`})
			
		if(qt == -1){
			qt = item.quantity;
			sendToBrowser("LOG", {username, html: `<p class='warn'>Aucune quantité spécifiée, on échange tout notre lot de <span style='color:white;'>${itemData.name}</span>.</p>`})
		}
		
		if(qt > item.quantity) return sendToBrowser("LOG", {username, html: `<p class='error'>Vous ne possedez pas la quantité nécessaire de <span style='color:white;'>${itemData.name}</span>.</p>`})
		
		socket.sendMessage("ExchangeObjectMoveMessage", {
			objectUID: item.UID,
			quantity: qt
		})
		
		await sleep(3000)
		return;
	}
	
	async takeObject(username, id, qt = -1){
		const socket = accounts[username].socket;
		
		if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})
		
		const itemData = items[id];
		if(!itemData) return sendToBrowser("LOG", {username, html: `<p class='error'>ID invalide, <b>${id}</b> n'existe pas dans le monde de Dofus Touch.</p>`})
		
		const item = accounts[username].plugins.Exchange.currentExchange.bot.objects.find(e => e.GID == id);
		if(!item) return sendToBrowser("LOG", {username, html: `<p class='error'>L'objet <span style='color:white;'>${itemData.name}</span> n'est pas dans l'échange.</p>`})
		
			
		if(qt == -1){
			
			qt = item.quantity;
		}
			
		if(qt > item.quantity) return sendToBrowser("LOG", {username, html: `<p class='error'>Il n'existe que <b>${item.quantity}x<span style='color:white;'>${itemData.name}</span> et vous demandez de prendre <b>${qt}</b>.</p>`})
		
		socket.sendMessage("ExchangeObjectMoveMessage", {
			objectUID: item.UID,
			quantity: -qt
		})
		
		await sleep(3000)
		return;
	}
	
	giveAllObjects(username, bankWhitelist = []){
		const socket = accounts[username].socket;
		
		if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})
			
		socket.sendMessage("ExchangeObjectTransfertListFromInvMessage", {
			ids: accounts[username].inventory.items.map(e => e.UID).filter(e => !bankWhitelist.includes(e))
		})
	}
	
	takeAllObjects(username, whitelist = []){
		const socket = accounts[username].socket;
		
		if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})
			
		socket.sendMessage("ExchangeObjectTransfertListToInvMessage", {
			ids: accounts[username].plugins.Exchange.currentExchange.bot.objects.map(e => e.UID).filter(e => !whitelist.includes(e))
		})
	}
	
	
	async sendKamas(username, qt = -1){
		const socket = accounts[username].socket;
		
		if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})
		
		if(qt == -1){
			qt = accounts[username].inventory.kamas;
		}
			
		if(qt > accounts[username].inventory.kamas) return sendToBrowser("LOG", {username, html: `<p class='error'>Vous ne possedez que <span style='color:white;'>${format(accounts[username].inventory.kamas)}K</span> et vous demandez de donner <span style='color:white;'>${format(qt)}K</span></p>`})
		
		if(qt == 0) return sendToBrowser("LOG", {username, html: `<p class='error'>Vous ne possedez pas de kamas à échanger.</p>`})
		socket.sendMessage("ExchangeObjectMoveKamaMessage", {
			quantity: qt
		})
		
		await sleep(3000)
		return;
	}
	
	async takeKamas(username, qt = -1){
		const socket = accounts[username].socket;
		
		if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})
		
		if(qt == -1){
			qt = accounts[username].plugins.Exchange.currentExchange.bot.kamas;
		}
			
		if(qt > accounts[username].plugins.Exchange.currentExchange.bot.kamas) return sendToBrowser("LOG", {username, html: `<p class='error'>Il n'existe que <span style='color:white;'>${format(accounts[username].plugins.Exchange.currentExchange.bot.kamas)}K</span> et vous demandez de prendre <span style='color:white;'>${format(qt)}K</span></p>`})
		
		socket.sendMessage("ExchangeObjectMoveKamaMessage", {
			quantity: -qt
		})
		
		await sleep(3000)
		return;
	}
	
	cancelExchange(username){
		const connection = accounts[username].socket;
		connection.sendMessage("LeaveDialogRequestMessage")
	}
	
	async validateExchange(username){
		const socket = accounts[username].socket;
		
		if(!accounts[username].plugins.Exchange.currentExchange) return sendToBrowser("LOG", {username, html: `<p class='error'>Le bot n'est pas en échange.</p>`})
			
		const validationConditions = [
			accounts[username].plugins.Exchange.currentExchange.bot.kamas == 0,
			accounts[username].plugins.Exchange.currentExchange.receiver.kamas == 0,
			accounts[username].plugins.Exchange.currentExchange.bot.objects.length == 0,
			accounts[username].plugins.Exchange.currentExchange.receiver.objects.length == 0
		]
		if(validationConditions.findIndex(e => e==false) == -1) {
			sendToBrowser("LOG", {username, html: `<p class='warn'>L'échange est vide, on peut pas le valider, on l'annule plutôt.</p>`})
			this.cancelExchange(username);
			return false;
		}
		
		sendToBrowser("LOG", {
			username,
			html: "<p class='info'>Validation de l'échange..</p>"
		})
		socket.sendMessage("ExchangeReadyMessage", {
			ready: true,
			step: accounts[username].plugins.Exchange.currentExchange.step
		})
		
		return true;
	}

}
