"use strict";


var logger = require("../../../Libs/Logger.js");

function serverDisconnecting(payload) {
	logger.warn(`[${payload.socket.account.username}]: DISCONNECTED | ${payload.data.reason}`);
	sendToBrowser("LOG", {username: payload.socket.account.username, html: `<p class='error'>Deconnexion du websocket: ${payload.data.reason}.</p>`})
	accounts[payload.socket.account.username].state = "OFFLINE";
}

module.exports = serverDisconnecting;
