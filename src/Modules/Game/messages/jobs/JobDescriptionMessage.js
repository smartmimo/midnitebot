const jobs = require("../../../../Assets/jobs.json");
const skillToItem = require("../../../../Assets/skillToItem.json");
const items = require("../../../../Assets/items.json");

function JobDescriptionMessage(payload){
	const {socket, data} = payload;
	const username = socket.account.username;
	
	for(const job of data.jobsDescription){
		accounts[username].jobs[job.jobId] = {
			...accounts[username].jobs[job.jobId],
			name: jobs[job.jobId].name,
			icon: jobs[job.jobId].icon,
			
			skills: job.skills.map(function(e){
				if(items[skillToItem[e.skillId]]){
					return {
						id: e.skillId, //45: Faucher
						min: e.min || e.maxSlots,
						max: e.max || e.maxSlots,
						item: {
							id: skillToItem[e.skillId],
							icon: items[skillToItem[e.skillId]].icon,
							name: items[skillToItem[e.skillId]].name
						}
					}
				} /*else {
					return {
						id: e.skillId, //45: Faucher
						maxSlots: e.maxSlots
					}
				}*/
			}).filter(skill => skill && skill.id)
		}
	}
	
	sendToBrowser("JOB_UPDATE", {
		username,
		jobs: accounts[username].jobs
	})
}

module.exports = JobDescriptionMessage;