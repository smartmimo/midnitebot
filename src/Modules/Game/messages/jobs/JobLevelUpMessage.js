function JobLevelUpMessage(payload){
	const {socket, data} = payload;
	const username = socket.account.username;
	
	global.accounts[username].jobs[data.jobsDescription.jobId].level = data.newLevel
	
	sendToBrowser("LOG", {
		username: socket.account.username,
		html: `<p class="info">Votre métier <span style='color:white;'>${accounts[username].jobs[data.jobsDescription.jobId].name}</span> passe au niveau <span style='color:white;'>${data.newLevel}</span></p>`
	})
	
	sendToBrowser("JOB_UPDATE", {
		username,
		jobs: accounts[username].jobs
	})
}

module.exports = JobLevelUpMessage;