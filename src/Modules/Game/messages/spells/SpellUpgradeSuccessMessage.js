const spellNames = require("../../../../Assets/spells.json");
const spellLevels = require("../../../../Assets/spellLevels.json");

function SpellUpgradeSuccessMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	
	
	const spell = accounts[username].plugins.Fighter.spells.find(e=>e.id == data.spellId)
	if(!spell){ //is new spell
		accounts[username].plugins.Fighter.spells.push({
			id: data.spellId, 
			level: data.spellLevel, 
			name: spellNames[data.spellId].name, 
			icon: spellNames[data.spellId].icon, 
			minRequiredLevel: spellLevels[spellNames[data.spellId].spellLevels[data.spellLevel]].minPlayerLevel,
			spellLevel: spellLevels[spellNames[data.spellId].spellLevels[data.spellLevel - 1]]
		})
		
		sendToBrowser("LOG", {
			username,
			html: `<p class="info">Vous avez obtenu un nouveau sort: <span style='color: white;'>${spellNames[data.spellId].name}</span>.</p>`
		})
	} else {
		spell.spellLevel = spellLevels[spellNames[data.spellId].spellLevels[data.spellLevel - 1]];
		spell.minRequiredLevel = data.spellLevel < 6 ? spellLevels[spellNames[data.spellId].spellLevels[data.spellLevel]].minPlayerLevel : 201; //To upgrade to next level
		spell.level = data.spellLevel
		
		sendToBrowser("LOG", {
			username,
			html: `<p class="success">Le sort <span style='color: white;'>${spellNames[data.spellId].name}</span> est désormais niveau <span style='color:white;'>${data.spellLevel}</span></p>`
		})
	}
	const i = setInterval(()=>{
		if(accounts[username].plugins.Fighter.stats.spellsPoints || accounts[username].plugins.Fighter.stats.spellsPoints == 0){
			
			//auto upgrade
			const spellsToUpgrade = configs[username].autoUpgradeSpells[accounts[username].extra.selectedCharacter.breed] || []
			for(const id of spellsToUpgrade){
				const spell = accounts[username].plugins.Fighter.spells.find(e => e.id == id);
				if(accounts[username].plugins.Fighter.stats.spellsPoints >= spell.level && (spell.level <= 5 && accounts[username].extra.selectedCharacter.level >= spell.minRequiredLevel)){
					socket.sendMessage("SpellUpgradeRequestMessage", {
						spellId: id,
						spellLevel: spell.level + 1
					})
					break;
				} else if(spell.level < 5 || (spell.level == 5 && accounts[username].extra.selectedCharacter.level >= spell.minRequiredLevel)){
					break;
				}
			}
			
			sendToBrowser("SPELLS_UPDATE", {
				username,
				spells: accounts[username].plugins.Fighter["spells"],
				spellPoints: accounts[username].plugins.Fighter.stats.spellsPoints,
				characterLevel: accounts[username].extra.selectedCharacter.level,
				autoUpgrade: spellsToUpgrade
			})
			clearInterval(i);
		} 
	}, 1000)
	
	
}

module.exports = SpellUpgradeSuccessMessage;