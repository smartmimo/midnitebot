
module.exports = function SystemMessageDisplayMessage(payload){
	const { socket, data } = payload;
	sendToBrowser("LOG", {username: socket.account.username, html: `<p class='warn'>${data.title}: ${data.text}`})
}