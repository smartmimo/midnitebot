"use strict";
const crypto = require("crypto");

function HelloConnectMessage(payload) {
	const { socket, data } = payload;
	// socket.account.salt = data.salt;
	// socket.account.key = data.key;
	// console.log("Auth listener triggered ...");
	
	socket.send("login", {
		haapiKeyCrypto: crypto.createHash("md5").update(accounts[socket.account.username].apiKey).digest("hex"),
		key: data.key,
		salt: data.salt,
		token: accounts[socket.account.username].token,
		tokenCrypto: crypto.createHash("md5").update(accounts[socket.account.username].token).digest("hex"),
		username: socket.account.username
	});
}

module.exports = HelloConnectMessage;