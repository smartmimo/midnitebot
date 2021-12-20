"use strict";

function LoginQueueStatusMessage(payload) {
	const { socket, data } = payload;
	sendToBrowser("LOG", {username: socket.account.username, html: `<p class='info'>File d'attente: <span style='color:white;'>${data.position}/${data.total}`})
}

module.exports = LoginQueueStatusMessage;