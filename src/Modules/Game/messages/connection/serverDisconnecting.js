const logger = require("../../../../Libs/Logger.js");

module.exports = function serverDisconnecting(payload) {
	logger.info(
		`[${payload.socket.account.username}]: disconnected | ${payload.data.reason}`
	);
	sendToBrowser("LOG", {username: payload.socket.account.username, html: `<p class='error'>Deconnexion du websocket: ${payload.data.reason}.</p>`})
	accounts[payload.socket.account.username].state = "OFFLINE";
}
