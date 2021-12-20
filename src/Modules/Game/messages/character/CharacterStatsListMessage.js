const effects = require("../../../../Assets/elementsEffects.json");

const upgradeConditions = require("../../../../Assets/costSteps.json");

const statNames = {
	11: "vitality",
	12: "wisdom",
	10: "strength",
	15: "intelligence",
	13: "chance",
	14: "agility"
}

function getStatCost(costSteps, statBase) {
	for (var i = costSteps.length - 1; i >= 0; i--) {
		if (statBase >= costSteps[i][0]) {
			return costSteps[i][1];
		}
	}
	return 0;
};

function CharacterStatsListMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	
	const breed = accounts[username].extra.selectedCharacter.breed;
	const stats=data.stats
	
	global.accounts[username].plugins.Fighter["stats"] = stats; //TODO: filter this object to only needed stuff
	
	const chati = {
		earthEffects: "Forcé",
		fireEffects: "Spirituel",
		waterEffects: "Osé",
		airEffects: "Agile"
	}
	var elements={}
	elements[stats.intelligence.alignGiftBonus + stats.intelligence.base + stats.intelligence.contextModif + stats.intelligence.objectsAndMountBonus] = "fireEffects"
	elements[stats.chance.alignGiftBonus + stats.chance.base + stats.chance.contextModif + stats.chance.objectsAndMountBonus] = "waterEffects"
	elements[stats.agility.alignGiftBonus + stats.agility.base + stats.agility.contextModif + stats.agility.objectsAndMountBonus] = "airEffects"
	elements[stats.strength.alignGiftBonus + stats.strength.base + stats.strength.contextModif + stats.strength.objectsAndMountBonus] = "earthEffects"
				
	const els=Object.keys(elements).map(Number)
	const max=Math.max.apply(Math, els)
	// if(max == NaN) console.log(els)
	
	if(max == 0 || max == NaN){
		accounts[username].plugins.Fighter["bestElement"] = {
			name: "none",
			chatiment: "none",
			effects: []
		}
	} else {
		accounts[username].plugins.Fighter["bestElement"] = {
			name: elements[max].split("Effects")[0],
			chatiment: chati[elements[max]],
			effects: effects[elements[max]]
		}
	}
	
	
	if(configs[username].autoUpgradeCharac[breed] && stats.statsPoints > 0) {
		const statId = configs[username].autoUpgradeCharac[breed];
		// const cost = upgradeConditions[breed][statId].filter(e => stats[statNames[statId]].base < e[0])[0][1]
		const cost = getStatCost(upgradeConditions[breed][statId], stats[statNames[statId]].base)
		if(stats.statsPoints >= cost){
			socket.sendMessage("StatsUpgradeRequestMessage", {
				boostPoint: stats.statsPoints - stats.statsPoints%cost,
				statId,
				useAdditionnal: false
			})
			socket.eventEmitter.once("StatsUpgradeResultMessage", (payload) => {
				if(payload.data.result == -1){
					sendToBrowser("LOG", {
						username,
						html: `<p class='error'>La mise à jour automatique des caractéristiques a rencontré une erreur: ${stats.statsPoints}, ${statId}, ${stats.statsPoints - stats.statsPoints%cost}</p>`
					})
				}
			})
		}
	}
	
	if(configs[username].autoUpgradeSpells[breed] && stats.spellsPoints > 0) {
		//auto upgrade
		for(const id of configs[username].autoUpgradeSpells[breed]){
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
	}
	
	const toSendStats = {
		username,
		stats: {
			vitality: {
				cost: getStatCost(upgradeConditions[breed][11], stats.vitality.base),
				value: stats.vitality.alignGiftBonus + stats.vitality.base + stats.vitality.contextModif + stats.vitality.objectsAndMountBonus
			},
			wisdom: {
				cost: getStatCost(upgradeConditions[breed][12], stats.wisdom.base),
				value: stats.wisdom.alignGiftBonus + stats.wisdom.base + stats.wisdom.contextModif + stats.wisdom.objectsAndMountBonus
			},
			strength: {
				cost: getStatCost(upgradeConditions[breed][10], stats.strength.base),
				value: stats.strength.alignGiftBonus + stats.strength.base + stats.strength.contextModif + stats.strength.objectsAndMountBonus
			},
			intelligence: {
				cost: getStatCost(upgradeConditions[breed][15], stats.intelligence.base),
				value: stats.intelligence.alignGiftBonus + stats.intelligence.base + stats.intelligence.contextModif + stats.intelligence.objectsAndMountBonus
			},
			chance: {
				cost: getStatCost(upgradeConditions[breed][13], stats.chance.base),
				value: stats.chance.alignGiftBonus + stats.chance.base + stats.chance.contextModif + stats.chance.objectsAndMountBonus
			},
			agility: {
				cost: getStatCost(upgradeConditions[breed][14], stats.agility.base),
				value: stats.agility.alignGiftBonus + stats.agility.base + stats.agility.contextModif + stats.agility.objectsAndMountBonus
			}
		},
		bestElement: max,
		statsPoints: stats.statsPoints,
		lifePoints: stats.lifePoints,
		maxLifePoints: stats.maxLifePoints,
		energyPoints: stats.energyPoints,
		experienceLevel: stats.experience - stats.experienceLevelFloor,
		experienceNextLevel: stats.experienceNextLevelFloor - stats.experienceLevelFloor,
		actionPoints: stats.actionPoints.base + stats.actionPoints.additionnal,
		movementPoints: stats.movementPoints.base + stats.movementPoints.additionnal,
		range: stats.range.base + stats.range.additionnal,
		summons: stats.summonableCreaturesBoost.base + stats.summonableCreaturesBoost.additionnal,
		initiative: stats.initiative.base + stats.initiative.additionnal,
		prospecting: stats.prospecting.base + stats.prospecting.additionnal,
		level: accounts[username].extra.selectedCharacter.level,
		autoUpgrade: configs[username].autoUpgradeCharac[breed],
		spellPoints: stats.spellsPoints
	}
	
	global.accounts[username].plugins.Fighter.stats.toSendStats = toSendStats
	sendToBrowser("STATS_UPDATE", toSendStats)
}

module.exports = CharacterStatsListMessage;