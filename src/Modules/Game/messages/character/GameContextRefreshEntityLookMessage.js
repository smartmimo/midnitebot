const cloudscraper = require('cloudscraper').defaults({
  agentOptions: {
    ciphers: 'AES256'
  }
})

function toHex(str){
	var arr1 = [];
	for (var n = 0, l = str.length; n < l; n ++) 
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	 }
	return arr1.join('');
}

module.exports = function GameContextRefreshEntityLookMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	
	if(data.id != accounts[username].extra.selectedCharacter.id) return;
	
	var entityLook = data.look;
	
	// console.log(entityLook)
	
	var bonesId = entityLook.bonesId;
	var skins = entityLook.skins.join(",");
	var colors = entityLook.indexedColors.map(e=>e=`${entityLook.indexedColors.indexOf(e)+1}=${e}`).join(",");
	var scales = entityLook.scales.join(",");

	const lookStr = `{${bonesId}|${skins}|${colors}|${scales}}`;
	
	var followerLookStr = false;
	if(data.look.subentities.length>0){
		var entityLook = data.look.subentities[0].subEntityLook;
		var bonesId = entityLook.bonesId;
		var skins = entityLook.skins.join(",");
		var colors = entityLook.indexedColors.map(e=>e=`${entityLook.indexedColors.indexOf(e)+1}=${e}`).join(",");
		var scales = entityLook.scales.join(",");
		followerLookStr = `{${bonesId}|${skins}|${colors}|${scales}}`;
	}
	/*accounts[username].extra.selectedCharacter.look = {
		character: 'http://staticns.ankama.com/dofus/renderer/look/'+toHex(lookStr)+'/full/1/150_300-0.png',
		follower: followerLookStr ? 'http://staticns.ankama.com/dofus/renderer/look/'+toHex(followerLookStr)+'/full/1/150_300-0.png' : null
	};*/
	
	cloudscraper({
		uri: 'http://staticns.ankama.com/dofus/renderer/look/'+toHex(lookStr)+'/full/1/150_300-0.png',
		encoding: null
	}).then(async(r)=>{
		if(!r) return;
		var toSend = {
			character: "data:image/png;base64,"+new Buffer(r, 'binary').toString('base64'),
			follower: null
		}
		if(followerLookStr){
			const follower = await cloudscraper({
				uri: 'http://staticns.ankama.com/dofus/renderer/look/'+toHex(followerLookStr)+'/full/1/150_300-0.png',
				encoding: null
			}).catch(e=>{
				return;
			})
			if(follower) toSend.follower = "data:image/png;base64,"+new Buffer.from(follower, 'binary').toString('base64')
		}
		accounts[username].extra.selectedCharacter.look = toSend;
		sendToBrowser("UPDATE_CHARACTER_LOOK", {username, look: toSend})
		
	}).catch(e=>{
		return;
	})

	
}
