const cloudscraper = require('cloudscraper').defaults({
  agentOptions: {
    ciphers: 'AES256'
  }
})

const generateString = require("../../../../Libs/generateString.js");

const antiAfk = true;


function toHex(str){
	var arr1 = [];
	for (var n = 0, l = str.length; n < l; n ++) 
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	 }
	return arr1.join('');
}

module.exports = function CharacterSelectedSuccessMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	const state = accounts[username];

	var selectedCharacter = data.infos
	
	sendToBrowser("LOG", {username: socket.account.username, html: `<p class='success'>Personnage selectionné: <span style='color:white;'>${selectedCharacter.name}</span></p>`})
	
	var entityLook = selectedCharacter.entityLook;
	
	// console.log(entityLook)
	
	var bonesId = entityLook.bonesId;
	var skins = entityLook.skins.join(",");
	var colors = entityLook.indexedColors.map(e=>e=`${entityLook.indexedColors.indexOf(e)+1}=${e}`).join(",");
	var scales = entityLook.scales.join(",");

	const lookStr = `{${bonesId}|${skins}|${colors}|${scales}}`;
	
	var followerLookStr = false;
	if(selectedCharacter.entityLook.subentities.length>0){
		var entityLook = selectedCharacter.entityLook.subentities[0].subEntityLook;
		var bonesId = entityLook.bonesId;
		var skins = entityLook.skins.join(",");
		var colors = entityLook.indexedColors.map(e=>e=`${entityLook.indexedColors.indexOf(e)+1}=${e}`).join(",");
		var scales = entityLook.scales.join(",");
		followerLookStr = `{${bonesId}|${skins}|${colors}|${scales}}`;
	}

	selectedCharacter = {
		breed: selectedCharacter.breed,
		characterName: selectedCharacter.name,
		level: selectedCharacter.level,
		id: selectedCharacter.id,
		look: {
			character: 'http://staticns.ankama.com/dofus/renderer/look/'+toHex(lookStr)+'/full/1/150_300-0.png',
			follower: followerLookStr ? 'http://staticns.ankama.com/dofus/renderer/look/'+toHex(followerLookStr)+'/full/1/150_300-0.png' : null
		},
		sex: selectedCharacter.sex
	};

	accounts[username].extra["selectedCharacter"] = selectedCharacter
	
	cloudscraper({
		uri: 'http://staticns.ankama.com/dofus/renderer/look/'+toHex(lookStr)+'/full/1/150_300-0.png',
		encoding: null
	}).then(async(r)=>{
		if(!r) return;
		var toSend = {
			character: "data:image/png;base64,"+new Buffer.from(r, 'binary').toString('base64'),
			follower: null
		}
		if(followerLookStr){
			const follower = await cloudscraper({
				uri: 'http://staticns.ankama.com/dofus/renderer/look/'+toHex(followerLookStr)+'/full/1/150_300-0.png',
				encoding: null
			}).catch(e=>{
				return;
			})
			if(follower) toSend.follower = "data:image/png;base64,"+new Buffer(follower, 'binary').toString('base64')
		}
		selectedCharacter.look = toSend
		sendToBrowser("UPDATE_CHARACTER_LOOK", {username, look: toSend})
		
	}).catch(e=>{
		return;
	})
	
	// sendToBrowser("UPDATE_CHARACTER_LOOK", {username, look: accounts[username].extra.selectedCharacter.look})
	sendToBrowser("FIGHT_INSTRUCTIONS", {username, instructions: accounts[username].plugins.Fighter.config.instructions[selectedCharacter.breed]})
	
	

	socket.send("moneyGoultinesAmountRequest");
	socket.sendMessage("QuestListRequestMessage");
	socket.sendMessage("FriendsGetListMessage");
	socket.sendMessage("IgnoredGetListMessage");
	socket.sendMessage("SpouseGetInformationsMessage");
	socket.send("setShopDetailsRequest", {});
	socket.sendMessage("OfflineOptionsUpdateRequestMessage", {
		options: "1,0,NON+PAN+PVN"
	});
	socket.send("bakSoftToHardCurrentRateRequest");
	socket.send("bakHardToSoftCurrentRateRequest");
	socket.send("restoreMysteryBox");
	
	socket.sendMessage("ClientKeyMessage", {
		key: generateString(20)
	});
	// socket.send("restoreMysteryBox");
	socket.sendMessage("GameContextCreateRequestMessage");
	
	
	const party = parties.find(party => party.members.includes(username))
	if(!party) setState(username, "IDLE");
	else {
		setState(username, "WAITING FOR PARTY")
		accounts[username].socket.eventEmitter.on("PARTY_READY", ()=>{
			if(accounts[username].state == "WAITING FOR PARTY") setState(username, "IDLE")
		})
		party.checkReady()
	}
	
	
	if (antiAfk){
		const id = setInterval(() => {
			if(accounts[username] && accounts[username].socket) socket.sendMessage("BasicPingMessage", { quiet: true })
			else clearInterval(id);
		}, 600000);
	}
}
