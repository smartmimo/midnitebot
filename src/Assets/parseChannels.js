const cloudscraper = require("cloudscraper");

async function getAsset(asset){
	const res = await cloudscraper.post("https://proxyconnection.touch.dofus.com/data/map?lang=fr&v=1.52.0", {
		body: JSON.stringify({
			"class": asset,
			"ids": []
		}),
		headers: {
			"content-type": "application/json; charset=utf-8"
		}
	})
	
	return JSON.parse(res);
}

const assets = {
/*Spell Levels*/
	spellLevels: async function (){
		const channels = await getAsset("spellLevels");

		const n = {};
		for(const id in channels){
			n[id] = {
				id: channels[id].id,
				effects: channels[id].effects.map(function(e){
					return {
						rawZone: e.rawZone,
						effectId: e.effectId,
						diceSide: e.diceSide,
						diceNum: e.diceNum,
					}
				}),
				apCost: channels[id].apCost,
				range: channels[id].range,
				maxCastPerTurn: channels[id].maxCastPerTurn,
				maxCastPerTarget: channels[id].maxCastPerTarget,
				minRange: channels[id].minRange,
				initialCooldown: channels[id].initialCooldown,
				minPlayerLevel: channels[id].minPlayerLevel,
				minCastInterval: channels[id].minCastInterval,
				castTestLos: channels[id].castTestLos
			}
		}

		require("fs").writeFileSync("spellLevels.json", JSON.stringify(n, null, 4));
	},

	spells: async function (){
		const channels = await getAsset("spells");

		const n = {};
		for(const id in channels){
			n[id] = {
				name: channels[id].nameId,
				icon: channels[id].iconId,
				spellLevels: channels[id].spellLevels
			}
		}

		require("fs").writeFileSync("spells.json", JSON.stringify(n, null, 4));
	},
	
	items: async function (){
		const channels = await getAsset("items");
		const types = await getAsset("itemTypes");

		const n = {};
		for(const id in channels){
			n[id] = {
				name: channels[id].nameId,
				icon: channels[id].iconId,
				type: {
					name: types[channels[id].typeId].nameId,
					id: channels[id].typeId,
					type: types[channels[id].typeId].superTypeId
				}
			}
		}

		require("fs").writeFileSync("items.json", JSON.stringify(n, null, 4));
	}
}

assets.spellLevels()