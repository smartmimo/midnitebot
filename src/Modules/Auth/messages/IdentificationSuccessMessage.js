"use strict";


var logger = require("../../../Libs/Logger.js");


function IdentificationSuccessMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	
	const extra = {
		nickname: data.nickname,
		accountSessionId: data.login,
		subscribtionEndDate: data.subscriptionEndDate,
		secretQuestion: data.secretQuestion
	};
	
	accounts[username]["extra"] = extra;

	if (extra.subscribtionEndDate === 0) logger.warn(`${username} is not subscribed`);
	sendToBrowser("LOG", {username, html: `<p class='warn'>${username} n'est pas abonné.</p>`})
	
	const timeout = setTimeout(()=>{
		socket.send("disconnecting", "CLIENT_CLOSING")
	}, 2000)
	socket.eventEmitter.once("ServersListMessage", (p)=>clearTimeout(timeout))
}

module.exports = IdentificationSuccessMessage;