const spellNames = require("../../../../Assets/spells.json");
const spellLevels = require("../../../../Assets/spellLevels.json");

function SpellListMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	
	accounts[username].plugins.Fighter["spells"] = data.spells.filter(e => e.spellId != 0).map(function(e){
		if(!spellNames[e.spellId]) return {
			id: e.spellId, 
			level: e.spellLevel, 
			name: "Error", 
			icon: "Error", 
			minRequiredLevel: 201,
			spellLevel: "Error"
		}
		const minRequiredLevel = e.spellLevel < 6 ? spellLevels[spellNames[e.spellId].spellLevels[e.spellLevel]].minPlayerLevel : 201;
		return {
			id: e.spellId, 
			level: e.spellLevel, 
			name: spellNames[e.spellId].name, 
			icon: spellNames[e.spellId].icon, 
			minRequiredLevel,
			spellLevel: spellLevels[spellNames[e.spellId].spellLevels[e.spellLevel - 1]]
		}
	});
	
	
	const i = setInterval(()=>{
		if(accounts[username].plugins.Fighter && accounts[username].plugins.Fighter.stats && (accounts[username].plugins.Fighter.stats.spellsPoints || accounts[username].plugins.Fighter.stats.spellsPoints == 0)){
			
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

module.exports = SpellListMessage;