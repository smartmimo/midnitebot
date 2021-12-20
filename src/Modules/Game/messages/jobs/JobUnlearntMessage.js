function JobUnlearntMessage(payload){
	delete global.accounts[payload.socket.account.username].jobs[payload.data.jobId];
	
	sendToBrowser("JOB_UPDATE", {
		username: payload.socket.account.username,
		jobs: accounts[payload.socket.account.username].jobs
	})
}

module.exports = JobUnlearntMessage;