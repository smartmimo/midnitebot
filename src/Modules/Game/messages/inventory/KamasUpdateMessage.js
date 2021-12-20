
function KamasUpdateMessage(payload){
	const {socket, data} = payload;
	const username = socket.account.username;
	
	accounts[username]["inventory"]["kamas"] = data.kamasTotal;
	sendToBrowser("KAMAS_UPDATE", {username, kamas: data.kamasTotal});
	
}

module.exports = KamasUpdateMessage;