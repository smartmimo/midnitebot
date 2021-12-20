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

function ServerStatusUpdateMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;

	const account = accounts[username];

	if (account.state != "WAITING FOR SERVER") return;

	if (account.auth.selectedServer.name == data.server._name) {
		logger.info(`[${username}]: Server Status | ${data.server._name} | ${serverStatus[data.server.status]}`);
		
		sendToBrowser("LOG", {username, html: `<p class='info'>${data.server._name}: ${serverStatus[data.server.status]}.</p>`})
		
		if (data.server.isSelectable) socket.sendMessage("ServerSelectionMessage", {
			serverId: data.server.id
		});
	}
}

module.exports = ServerStatusUpdateMessage;
