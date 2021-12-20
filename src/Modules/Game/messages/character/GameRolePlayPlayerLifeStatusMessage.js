function GameRolePlayPlayerLifeStatusMessage(payload){
	const {socket, data} = payload;
	const username = socket.account.username;
	
	if(data.state == 1){
		setState(username, "BURIED ALIVE")
		sendToBrowser("LOG", {
			username,
			html: "<p class='warn'>*Everyone has to get buried alive at least once in their life.*</p>"
		})
		
	}
}

module.exports = GameRolePlayPlayerLifeStatusMessage;