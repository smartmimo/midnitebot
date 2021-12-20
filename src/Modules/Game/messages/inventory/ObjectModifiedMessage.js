const items = require("../../../../Assets/items.json");
const effectJSON = require("../../../../Assets/effects.json");

function ObjectModifiedMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;

	const item = data.object;
	const itemIndex = accounts[username]["inventory"].items.findIndex(e => e.UID == item.objectUID);
	
	
		var effects = `<p style = 'color: #f4d35e;'>${items[item.objectGID].name} <span style='color:white;'>(${item.objectGID})</span></p>`
		effects += "<ul>";
		
		if(item.effects.length < 40)
			for(const effect of item.effects){
				effects += "<li>"
				const effectData = effectJSON[effect.actionId];
				if(!effectData){
					console.log("No effect data for effect id:", effect.actionId, "in item:", items[item.objectGID].name)
					continue;
				}
				if(effect.value && effectData.descriptionId){
					if(effectData.operator == "+" || effectData.operator == "-"){
						effects += `<p style='color: ${effectData.operator == "+" ? "green" : "red"};'>${effectData.descriptionId.replace("#1\{~1~2 à \}#2", effect.value)}</p>`
					} else {
						effects += `<p style='color: white;'>${effectData.descriptionId.replace("#1", effect.value).replace("#2", effect.value).replace("#3", effect.value)}</p>`
					}
				} else if(effect.min && effect.max){
					effects += `<p style='color: white;'>${effectData.descriptionId.replace("#1\{~1~2", effect.min).replace("\}#2", effect.max)}</p>`
				} else if(effectData.descriptionId) {
					if(Object.keys(effect).includes("day")) effects += `<p style='color: white;'>${effectData.descriptionId.replace("#1", effect.day+"/"+(effect.month+1)+"/"+effect.year+" "+effect.hour+":"+effect.minute)}</p>`
				}
				effects += "</li>"
				effects.replace("<li></li>", "")
			}
		effects += "</ul>"
		accounts[username]["inventory"].items[itemIndex] = {
			GID: item.objectGID,
			UID: item.objectUID,
			quantity: item.quantity,
			position: item.position,
			effects,
			...items[item.objectGID]
		}
	
	
	sendToBrowser("INVENTORY_UPDATE", {
		username,
		item: accounts[username]["inventory"].items.find(e => e.UID == item.objectUID)
		// items: accounts[username]["inventory"]["items"],
		// UID: item.objectGID
		// kamas: accounts[username]["inventory"].kamas
	})
}

module.exports = ObjectModifiedMessage;