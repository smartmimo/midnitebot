
module.exports = async function LifePointsRegenBeginMessage(payload){
	const {socket, data} = payload
	const username = socket.account.username;
	
	if(!accounts[username].plugins.Fighter.stats) await new Promise(r => socket.eventEmitter.once("CharacterStatsListMessage", r))
	
	if(accounts[username].plugins.Fighter.stats.lifePoints >= accounts[username].plugins.Fighter.stats.maxLifePoints) return;
	
	if(data.regenRate != 5)
		sendToBrowser("LOG", {
			username,
			html: `<p class='info'>Début de la génération de vie.</p>`
		})
			
	var gained = 0;
	const interval = setInterval(()=>{
		if(accounts[username] && accounts[username].plugins.Fighter.stats.lifePoints / accounts[username].plugins.Fighter.stats.maxLifePoints >= configs[username].minLP/100){
			// sendToBrowser("LOG", {username, html: "<p>sending fight signal</p>"})
			socket.eventEmitter.emit("ReadyToFight")
		}
		if(!accounts[username] || accounts[username].plugins.Fighter.stats.lifePoints >= accounts[username].plugins.Fighter.stats.maxLifePoints){
			return clearInterval(interval)
		}
		
		accounts[username].plugins.Fighter.stats.lifePoints += 1
		gained += 1
		sendToBrowser("HEALTH_UPDATE", {
			username,
			lifePoints: accounts[username].plugins.Fighter.stats.lifePoints,
			maxLifePoints: accounts[username].plugins.Fighter.stats.maxLifePoints
		})
	}, data.regenRate*0.1 * 1000)
	
	socket.eventEmitter.once("LifePointsRegenEndMessage", (payload)=>{
		if(accounts[username].plugins.Fighter.stats.lifePoints / accounts[username].plugins.Fighter.stats.maxLifePoints >= configs[username].minLP/100){
			// sendToBrowser("LOG", {username, html: "<p>sending fight signal</p>"})
			socket.eventEmitter.emit("ReadyToFight")
		}
		
		if(interval && interval._idleTimeout != 500){
			sendToBrowser("LOG", {
				username,
				html: `<p class='info'>Fin de la regénération.</p>`
			})
		}
			
		clearInterval(interval)
		
		accounts[username].plugins.Fighter.stats.lifePoints = payload.data.lifePoints;
		
		sendToBrowser("HEALTH_UPDATE", {
			username,
			lifePoints: accounts[username].plugins.Fighter.stats.lifePoints,
			maxLifePoints: accounts[username].plugins.Fighter.stats.maxLifePoints
		})
		
	})
}