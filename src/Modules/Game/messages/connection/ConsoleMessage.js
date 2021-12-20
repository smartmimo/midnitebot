function ConsoleMessage(payload){
	sendToBrowser("LOG", {
		username: payload.socket.account.username,
		html: `<p class='error'>CONSOLE MESSAGE: <pre class='error'>${JSON.stringify(payload.data, null, 4)}</pre></p>`
	})
}

module.exports = ConsoleMessage;