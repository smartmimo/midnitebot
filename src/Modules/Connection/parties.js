function idGen() {
	return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

module.exports = class {
	constructor(leader, slaves, id = null) {		
		this.partyId = id || idGen();
		
		this.leader = leader;
		this.slaves = slaves;	
		this.members = [this.leader, ...this.slaves]
		
		this.isReady = false;
		
		this.members.map(username => {
			if(accounts[username]){
				accounts[username].socket.eventEmitter.on("PARTY_READY", ()=>{
					if(accounts[username].state == "WAITING FOR PARTY") setState(username, "IDLE")
				})
			}
		})
	}

	login(ws){
		for(const username of this.members){
			if(!accounts[username] || accounts[username].state == "OFFLINE"){
				setTimeout(()=>{
					ws.emit("message", JSON.stringify({
						message: "LOGIN",
						data: {
							user: username, 
							party: username != this.leader
						}
					}))
				}, Math.floor(Math.random() * 1000))
					
			} else {
				setState(username, "WAITING FOR PARTY")
			}
		}
	}
	
	checkReady(){
		// if(this.isReady) return;
		
		console.log("checking ready")
		var isReady = true;
		for(const member of this.members){
			if(!accounts[member] 
				|| !["WAITING FOR PARTY", "IDLE"].includes(accounts[member].state)
				|| (accounts[member].plugins.Map.id && (accounts[member].plugins.Map.id != accounts[this.leader].plugins.Map.id))
			){
				isReady = false;
				if(accounts[member] && accounts[member].state == "IDLE") setState(member, "WAITING FOR PARTY")
			}
			else setState(member, "WAITING FOR PARTY")
		}
		
		if(isReady) this.triggerReady()
		else this.isReady = false;
	
		return this.isReady
	}

	triggerReady(){
		console.log("triggering ready")
		this.isReady = true;
		for(const username of this.members) {
			if(accounts[username]) accounts[username].socket.eventEmitter.emit("PARTY_READY")
		}
		// console.log("is_ready")
	}
	
	deleteMember(username){
		if(username == this.leader) return;
		
		this.members = this.members.filter(member => member != username)
		this.slaves = this.slaves.filter(member => member != username)
		
		this.isReady = false;
		
		if(accounts[username]){
			accounts[username].socket.eventEmitter.off("PARTY_READY")
			if(accounts[username].script && accounts[username].script.running) accounts[username].script.forceStopScript()
		}
	
		this.checkReady()
	}
	
	addMember(username, ws = null){
		if(this.members.includes(username)) return;
		
		if(accounts[this.leader] && accounts[this.leader].script && ws){
			if(accounts[this.leader].script.running){
				ws.emit("message", (
					JSON.stringify({
						message: "STOP_SCRIPT", 
						data: {
							username: this.leader
						}
					})
				))
			}
			
			// console.log(accounts[this.leader].script.textCode)
			ws.emit("message", (
				JSON.stringify({
					message: "LOAD_SCRIPT", 
					data: {
						username,
						name: accounts[this.leader].script.name,
						code: accounts[this.leader].script.textCode,
						path: null
					}
				})
			))
		}
		
		this.members.push(username)
		this.slaves.push(username)

		this.isReady = false;
		
		if(accounts[username]) accounts[username].socket.eventEmitter.on("PARTY_READY", ()=>{
			if(accounts[username].state == "WAITING FOR PARTY") setState(username, "IDLE")
		})
	
		this.checkReady()
	}
	
	purge(){
		this.triggerReady();
		
		for(const username of this.members) {
			if(accounts[username] && accounts[username].script && accounts[username].script.running) accounts[username].script.forceStopScript()
		}
	
		this.members = null;
		this.slaves = null;
		this.leader = null;
	}
}
