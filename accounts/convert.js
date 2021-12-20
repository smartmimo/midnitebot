const accounts = require("./accounts old.json")

for(const acc of accounts){
	const username = acc.username
	delete acc.username
	
	acc["fightConfig"] = {
						auto: true,
						spellsToUse: [],
						berserker: false,
						maxDistance: 12,
						skipTurn: false,
						instructions: []
					}
	require("fs").writeFileSync(username+".json", JSON.stringify(acc, null, 4))
	
}