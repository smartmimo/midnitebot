const jobs = require("../../../../Assets/jobs.json");

function JobExperienceMultiUpdateMessage(payload){
	const {socket, data} = payload;
	const username = socket.account.username;
	
	for(const job of data.experiencesUpdate){
		accounts[username].jobs[job.jobId] = {
			...accounts[username].jobs[job.jobId],
			name: jobs[job.jobId].name,
			icon: jobs[job.jobId].icon,
			
			level: job.jobLevel,
			experienceLevel: job.jobLevel == 100 ? 666 : job.jobXP - job.jobXpLevelFloor,
			experienceNextLevel: job.jobLevel == 100 ? 666 : job.jobXpNextLevelFloor - job.jobXpLevelFloor
		}
	}
	
	sendToBrowser("JOB_UPDATE", {
		username,
		jobs: accounts[username].jobs
	})
}

module.exports = JobExperienceMultiUpdateMessage;