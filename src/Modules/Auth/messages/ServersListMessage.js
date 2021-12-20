"use strict";

const logger = require("../../../Libs/Logger.js");

const serverStatus = {
	0: "STATUS_UNKNOWN",
	1: "OFFLINE",
	2: "STARTING",
	3: "ONLINE",
	4: "NOJOIN",
	5: "SAVING",
	6: "STOPPING",
	7: "FULL"
};



async function ServersListMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	
	const serversById = {};
	const serversByName = {};
	
	for (let server of data.servers) {
		// if (server.charactersCount) {
		serversById[server.id] = {
			name: server._name,
			id: server.id,
			status: server.status,
			completion: server.completion,
			charactersCount: server.charactersCount,
			gameTypeId: server._gameTypeId,
			date: server.date,
			isSelectable: server.isSelectable
		};
		serversByName[server._name] = {
			name: server._name,
			id: server.id,
			status: server.status,
			completion: server.completion,
			charactersCount: server.charactersCount,
			gameTypeId: server._gameTypeId,
			date: server.date,
			isSelectable: server.isSelectable
		};
		// }
	}


	var autoSelectServer = configs[username].autoSelectServer;
	let selected;
	
	const party = parties.find(party => party.slaves.includes(username))
	
	if(party){
		sendToBrowser("LOG", {
			username, 
			html: `<p class='info'>Attente de la connexion du chef..</p>`
		})
		await new Promise(async r => {
			while(true){
				if(accounts[party.leader]) break;
				await new Promise(r => setTimeout(r, 3000))
			}
			if(!accounts[party.leader].auth || !accounts[party.leader].auth.selectedServer){
				accounts[party.leader].socket.eventEmitter.once("SelectedServerDataMessage", r)
			} else r()
		});
		const name = accounts[party.leader].auth.selectedServer.name
		selected = serversByName[accounts[party.leader].auth.selectedServer.name].id
		sendToBrowser("LOG", {
			username, 
			html: `<p class='info'>Le chef est sur <span style='color:white;'>${name}</span>, selection de ce dernier..</p>`
		})
	} else {
		if(!serversByName[configs[username].server] && !autoSelectServer){
			sendToBrowser("LOG", {username, html: `<p class='warn'>Le serveur <span style='color:white;'>${configs[username].server}</span> spécifié dans la config est invalide, selection automatique en cours...</p>`})
			autoSelectServer = true;
		}
		
		if (autoSelectServer) {
			let flag = 0;
			// const serverIds = Object.keys(serversById);
			const serverIds = [403, 404, 405]
			selected = Number(serverIds[Math.floor(Math.random()*serverIds.length)]);
			for (let serverId in serversById) {
				if (serversById[serverId].date > flag) {
					selected = Number(serverId);
					flag = serversById[serverId].date;
				}
			}
		} else {
			selected = serversByName[configs[username].server].id;
		}
	}
	
	const serverId = selected;
	const server = serversById[serverId];
	
	if(!server){
		return sendToBrowser("LOG", {username, html: `<p class='error'>Aucun personnage trouvé.</p>`})
	}
	
	accounts[username]["auth"] = {selectedServer: server};
	
	if (server.isSelectable) {
		socket.sendMessage("ServerSelectionMessage", {
			serverId
		})
		logger.warn(`[${username}]: Selected server: \x1b[33m${server.name.toUpperCase()}\x1b[0m`);
		sendToBrowser("LOG", {username, html: `<p class='info'>Selection du serveur: ${server.name}.</p>`})
		// console.log(accounts)
		
	} else {
		logger.info(`[${username}]: Server Status | ${server.name} | \x1b[33m${serverStatus[server.status]}\x1b[0m`);
		if(serverStatus[server.status] == "ONLINE"){
			sendToBrowser("LOG", {username, html: `<p class='warn'>Le serveur ${server.name} n'est pas sélectionnable (Peut-être le serveur est international?).</p>`})
			setState(username, "CAN'T CONNECT");	
		} else {
			sendToBrowser("LOG", {username, html: `<p class='warn'>Le serveur ${server.name} n'est pas disponible: ${serverStatus[server.status]}.</p>`})
			sendToBrowser("LOG", {username, html: `<p class='info'>Attente de disponibilité..</p>`})
			setState(username, "WAITING FOR SERVER");	
		}
	}
}

module.exports = ServersListMessage;

