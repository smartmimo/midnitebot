module.exports = class Events {
	constructor() {
		this.listeners = [
			this.ExchangeRequestedTradeMessage,
			this.ExchangeStartedWithPodsMessage,
			this.ExchangeIsReadyMessage,
			this.ExchangeLeaveMessage,
			this.ExchangeKamaModifiedMessage,
			this.ExchangeObjectAddedMessage, 
			this.ExchangeObjectRemovedMessage, 
			this.ExchangeObjectModifiedMessage,
			
			this.ExchangeStartedWithStorageMessage,
			this.StorageInventoryContentMessage,
			this.StorageObjectUpdateMessage,
			this.StorageObjectsUpdateMessage,
			this.StorageObjectRemoveMessage,
			this.StorageObjectsRemoveMessage,
			this.StorageKamasUpdateMessage,
			
			this.ExchangeStartOkNpcTradeMessage,
			
			this.ExchangeErrorMessage
		];
	}
	
	ExchangeRequestedTradeMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		if(data.source == accounts[username].extra.selectedCharacter.id) return;
		
		if(!accounts[username].plugins.Exchange.whitelisted.find(e => e.id == data.source)) return socket.sendMessage("LeaveDialogRequestMessage");
		
		socket.sendMessage("ExchangeAcceptMessage");

	}

	ExchangeStartedWithPodsMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		setState(username, "EXCHANGING");
		accounts[username].plugins.Exchange.currentExchange = {
			bot: {
				objects: [],
				kamas: 0
			},
			receiver: {
				id: data.secondCharacterId,
				isNpc: false,
				name: accounts[username].plugins.Map.actors[data.secondCharacterId],
				objects: [],
				kamas: 0
			},
			step: 0
		}
		
		sendToBrowser("LOG", {
			username,
			html: `<p class='warn'>Echange lancé.</p>`
		})
	}
	
	
	
	ExchangeStartOkNpcTradeMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		
		setState(username, "EXCHANGING");
		accounts[username].plugins.Exchange.currentExchange = {
			bot: {
				objects: [],
				kamas: 0
			},
			receiver: {
				id: data.npcId,
				isNpc: true,
				objects: [],
				kamas: 0
			},
			step: 0
		}
		
		sendToBrowser("LOG", {
			username,
			html: `<p class='warn'>Echange lancé avec NPC.</p>`
		})
	}

	ExchangeKamaModifiedMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		if(!data.remote) accounts[username].plugins.Exchange.currentExchange.bot.kamas = data.quantity
		else accounts[username].plugins.Exchange.currentExchange.receiver.kamas = data.quantity
		accounts[username].plugins.Exchange.currentExchange.step++
	}

	ExchangeLeaveMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		if(accounts[username].plugins.Exchange.currentExchange && !accounts[username].plugins.Exchange.currentExchange.receiver)
			sendToBrowser("LOG", {
				username,
				html: `<p class='info'>Banque fermé.</p>`
			})
			
		if(accounts[username].plugins.Shop.merchant){
			delete global.accounts[username].plugins.Shop.merchant
			sendToBrowser("LOG", {
				username,
				html: `<p class='info'>Mode marchand fermé.</p>`
			})
		}
		
		setState(username, "IDLE");
		accounts[username].plugins.Exchange.currentExchange = false;
	}

	ExchangeIsReadyMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		socket.sendMessage("ExchangeReadyMessage", {
			ready: true,
			step: accounts[username].plugins.Exchange.currentExchange.step
		})
	}
	
	ExchangeObjectAddedMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		const objectToPush = {
			GID: data.object.objectGID,
			UID: data.object.objectUID,
			quantity: data.object.quantity
		}
		if(!data.remote){
			accounts[username].plugins.Exchange.currentExchange.bot.objects.push(objectToPush)
		} else {
			accounts[username].plugins.Exchange.currentExchange.receiver.objects.push(objectToPush)
		}
		accounts[username].plugins.Exchange.currentExchange.step++
	}

	ExchangeObjectRemovedMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		if(!data.remote){
			accounts[username].plugins.Exchange.currentExchange.bot.objects = accounts[username].plugins.Exchange.currentExchange.bot.objects.filter(e => e.UID != data.objectUID)
		} else{
			accounts[username].plugins.Exchange.currentExchange.receiver.objects = accounts[username].plugins.Exchange.currentExchange.receiver.objects.filter(e => e.UID != data.objectUID)
		}
		accounts[username].plugins.Exchange.currentExchange.step++
	}

	ExchangeObjectModifiedMessage(payload) {
		const { socket, data } = payload;
		const username = socket.account.username;
		
		const objectToPush = {
			GID: data.object.objectGID,
			UID: data.object.objectUID,
			quantity: data.object.quantity
		}
		if(!data.remote){
			const i = accounts[username].plugins.Exchange.currentExchange.bot.objects.findIndex(e => e.UID == data.object.objectUID)

			accounts[username].plugins.Exchange.currentExchange.bot.objects[i]  = objectToPush
		} else {
			const i = accounts[username].plugins.Exchange.currentExchange.receiver.objects.findIndex(e => e.UID == data.object.objectUID)
			accounts[username].plugins.Exchange.currentExchange.receiver.objects[i]  = objectToPush
		}
		accounts[username].plugins.Exchange.currentExchange.step++
	}
	
	/**BANK**/
	ExchangeStartedWithStorageMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		
		setState(username, "EXCHANGING");
		
		if(data.exchangeType == 5)
			sendToBrowser("LOG", {
				username,
				html: `<p class='info'>Banque ouverte.</p>`
			})
	}
	
	StorageInventoryContentMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		
		accounts[username].plugins.Exchange.currentExchange = {
			bot: {
				objects: data.objects.map(function(e){return {GID: e.objectGID, UID: e.objectUID, quantity: e.quantity}}),
				kamas: data.kamas
			}
		}
	}
	
	StorageObjectUpdateMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		
		const object = {
			GID: data.object.objectGID,
			UID: data.object.objectUID,
			quantity: data.object.quantity
		}
		
		const i = accounts[username].plugins.Exchange.currentExchange.bot.objects.findIndex(e => e.UID == object.UID)
		if(i == -1) accounts[username].plugins.Exchange.currentExchange.bot.objects.push(object)
		else accounts[username].plugins.Exchange.currentExchange.bot.objects[i] == object
	}
	StorageObjectsUpdateMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		for(const o of data.objectList){
			const object = {
				GID: o.objectGID,
				UID: o.objectUID,
				quantity: o.quantity
			}
			
			const i = accounts[username].plugins.Exchange.currentExchange.bot.objects.findIndex(e => e.UID == object.UID)
			if(i == -1) accounts[username].plugins.Exchange.currentExchange.bot.objects.push(object)
			else accounts[username].plugins.Exchange.currentExchange.bot.objects[i] == object
		}
	}
	
	StorageObjectRemoveMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		
		accounts[username].plugins.Exchange.currentExchange.bot.objects = accounts[username].plugins.Exchange.currentExchange.bot.objects.filter(e => e.UID != data.objectUID)
	}
	
	StorageObjectsRemoveMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		for(const o of data.objectUIDList) accounts[username].plugins.Exchange.currentExchange.bot.objects = accounts[username].plugins.Exchange.currentExchange.bot.objects.filter(e => e.UID != o)
	}
	
	StorageKamasUpdateMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		
		accounts[username].plugins.Exchange.currentExchange.bot.kamas = data.kamasTotal
	}
	
	ExchangeErrorMessage(payload){
		const { socket, data } = payload;
		const username = socket.account.username;
		
		sendToBrowser("LOG", {
			username,
			html: `<p class='error'>Erreur echange: ${data.errorType}</p>`
		})
	}
}