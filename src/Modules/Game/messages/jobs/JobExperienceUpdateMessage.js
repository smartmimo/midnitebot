function JobExperienceUpdateMessage(payload){
	const {socket, data} = payload;
	const username = socket.account.username;
	
	if(accounts[username].jobs[data.experiencesUpdate.jobId].level == 100) return;
	accounts[username].jobs[data.experiencesUpdate.jobId].experienceLevel = data.experiencesUpdate.jobXP - data.experiencesUpdate.jobXpLevelFloor
	accounts[username].jobs[data.experiencesUpdate.jobId].experienceNextLevel = data.experiencesUpdate.jobXpNextLevelFloor - data.experiencesUpdate.jobXpLevelFloor
	
	sendToBrowser("JOB_UPDATE", {
		username,
		jobs: accounts[username].jobs
	})
}

module.exports = JobExperienceUpdateMessage;