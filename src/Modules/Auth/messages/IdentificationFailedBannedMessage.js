"use strict";
const logger = require("../../../Libs/Logger.js");

function IdentificationFailedBannedMessage(payload) {
	const { socket } = payload;
	const username = socket.account.username;
	logger.error(new Error(`[${socket.account.username}]: Account banned.`));
	sendToBrowser("LOG", {username, html: "<p class='error'>Erreur de connexion: compte banni.</p>"})
	delete accounts[socket.account.username];
	socket.destroy();
}
module.exports = IdentificationFailedBannedMessage;