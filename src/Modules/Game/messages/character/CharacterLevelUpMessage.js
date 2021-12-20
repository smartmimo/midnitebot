module.exports = function CharacterLevelUpMessage(payload){
	const {socket, data} = payload;
	
	accounts[socket.account.username].extra.selectedCharacter.level = data.newLevel
	sendToBrowser("LOG", {
		username: socket.account.username,
		html: `<p class="info">Votre personnage est désormais niveau <span style='color:white;'>${data.newLevel}</span></p>`
	})
}