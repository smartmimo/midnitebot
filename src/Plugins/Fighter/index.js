const Events = require("./events");

const effects = require("../../Assets/effects.json");
const alwaysChooseSpells = require("../../Assets/alwaysChooseSpells.json");
const elementsEffects = require("../../Assets/elementsEffects.json");
const chati = {
		earthEffects: "Forcé",
		fireEffects: "Spirituel",
		waterEffects: "Osé",
		airEffects: "Agile"
	}
	
const {
	getClosestFighterOfCell,
	getCellDistance,
	PathNode,
	MoveNode,
	getNeighbourCells,
	getSpellRange,
	testLos,
	getCellIdFromMapPoint,
	transformStates,
	n,
	shaperMap,
	getMapPointFromCellId
} = require("./util.js");
	
const elementEffects = {
	"waterEffects": [85, 91, 96, 123, 152, 275, 426, 1014, 1065, 1068, 1095, 1121, 1127, 1132, 1137],
	"earthEffects": [86, 92, 97, 118, 157, 276, 422, 1122, 1128, 1140],
	"airEffects": [87, 93, 98, 119, 277, 428, 1013, 1064, 1067, 1093, 1119, 1125, 1131, 1136],
	"fireEffects": [88, 94, 99, 108, 126, 155, 278, 424, 1015, 1037, 1066, 1069, 1094, 1120, 1126, 1133, 1138],
	"neutralEffects": [82, 89, 95, 100, 143, 144, 279, 430, 670, 671, 672, 1012, 1071, 1092, 1109, 1118, 1124, 1134, 1139],
	"boostEffects": [108, 110, 111, 112, 114, 115, 117, 118, 119, 120, 121, 123, 124, 125, 126, 128, 136, 137, 138, 142, 158, 160,161, 752, 753, 165, 174, 176, 178, 182, 183, 184, 776, 788, 210, 211, 212, 213, 214, 240, 241, 242, 243,244, 250, 251, 252, 253, 254, 260, 261, 262, 263, 264, 1039, 1040, 281, 282, 283, 284, 285, 286, 287,288, 289, 290, 291, 292, 293, 1054]
}

const ratios = {
	allyRatio: 0.5,
	killRatio: 6,
	isSummonRatio: 0.7
}

const log = {
	success: (username, msg, debug = false)=>{if(!debug || (!debug || (debug && accounts[username].plugins.Fighter.config.debug == true))) sendToBrowser("LOG", {username, html: `<p class='success'>${msg}</p>`})},
	info: (username, msg, debug = false)=>{if(!debug || (debug && accounts[username].plugins.Fighter.config.debug == true)) sendToBrowser("LOG", {username, html: `<p class='info'>${msg}</p>`})},
	warn: (username, msg, debug = false)=>{if(!debug || (debug && accounts[username].plugins.Fighter.config.debug == true)) sendToBrowser("LOG", {username, html: `<p class='warn'>${msg}</p>`})},
	error: (username, msg, debug = false)=>{if(!debug || (debug && accounts[username].plugins.Fighter.config.debug == true)) sendToBrowser("LOG", {username, html: `<p class='error'>${msg}</p>`})}
}

const delay = 100;

function sleep(ms){
	return new Promise(r => setTimeout(r, ms))
}
module.exports = class Fighter extends Events {
	constructor() {
		super();
	}
	
	getActorOnCell(username, cellId) {
		for (const id in accounts[username].plugins.Fighter.fighters) {
			if (accounts[username].plugins.Fighter.fighters[id].disposition.cellId == cellId) {
				return accounts[username].plugins.Fighter.fighters[id];
			}
		}
		return false;
	}
	
	/**
	 ** Returns all alive enemies
	 **/
	getAliveEnemies(username) {
		return this.getAliveFromTeam(username, accounts[username].plugins.Fighter.teamId == 0 ? 1 : 0);
	}

	/**
	 ** Returns all alive allies
	 **/
	getAliveAllies(username) {
		return this.getAliveFromTeam(username, accounts[username].plugins.Fighter.teamId == 0 ? 0 : 1);
	}
	
	/**
	 ** Returns all alive fighters from a team
	 **/
	getAliveFromTeam(username, teamId) {
		var fighters = accounts[username].plugins.Fighter.fighters;
		var retFighters = [];
		for (const index in fighters) {
			const fighter = fighters[index];
			if (fighter.stats.lifePoints > 0 && fighter.alive && fighter.teamId == teamId) { //checking if alive
				retFighters.push(fighter);
			}
		}
		return retFighters;
	}
	
	/**
	 ** Returns object of all fighters present in the map that are visible
	 **/
	getIndexedVisibleActors(username) {
		var e = {};
		const fighters = accounts[username].plugins.Fighter.fighters;
		for (var t in fighters) fighters[t].alive == false || fighters[t].isInvisible || (e[fighters[t].disposition.cellId] = fighters[t]);
		return e
	}
	
	 /** Returns object of how much action points and move points a fighter is gonna lose if tackled by given fighters
	 * @param {int} fighter contextual id
	 * @param {array} array of tacklers
	 **/
	getTackleCost(username, actor, tacklers, mp, ap) {
		mp = Math.max(0, mp);
		ap = Math.max(0, ap);
		var cost = {
			mp: 0,
			ap: 0
		};
		if (!this.canBeTackled(username, actor)) {
			return cost;
		}
		if (tacklers.length === 0) {
			return cost;
		}

		for (var i in tacklers) {
			var tackler = tacklers[i];
			if (!tackler) {
				continue;
			} // tackler may have died at this point
			if (!this.canBeTackler(username, tackler, actor)) {
				continue;
			}
			var tackle = this.getTackleRatio(username, actor, tackler);
			if (tackle >= 1) {
				continue;
			}
			cost.mp += ~~(mp * (1 - tackle) + 0.5);
			cost.ap += ~~(ap * (1 - tackle) + 0.5);
		}

		return cost;
	}
	/**
	 ** Checks if given fighter can be tackled
	 * @param {int} fighter contextual id
	 **/
	canBeTackled(username, actor) {
		const fighter = accounts[username].plugins.Fighter.fighters[actor];
		if (!fighter) {
			console.error('canBeTackled: Corresponding fighter could not be found.');
			return false;
		}
		if (fighter.stats.invisibilityState != 3) {
			return false;
		} //if isn't visible
		if (fighter.isCarryied) {
			return false;
		}
		if (fighter.status.statusId == 96) {
			return false;
		} //UNTACKLABLE
		if (fighter.status.statusId == 6) {
			return false;
		} //ROOTED

		return true;
	}

	/**
	 ** Checks if given fighter is eligible to tackle a fighter
	 * @param {object} tackler json
	 * @param {int} fighter contextual id
	 **/
	canBeTackler(username, tackler, actor) {
		var tacklerFighter = tackler;
		var actorFighter = accounts[username].plugins.Fighter.fighters[actor];
		if (!tacklerFighter || !actorFighter) {
			console.warn('canBeTackler: Corresponding fighters could not be found. ' + tackler.contextualId + " " + actor);
			return false;
		}

		if (tacklerFighter.stats.invisibilityState != 3) {
			return false;
		} //if isn't visible
		if (tacklerFighter.teamId === actorFighter.teamId) {
			return false;
		} // same team
		if (tacklerFighter.alive === false) {
			return false;
		} // tackler is dead
		if (tacklerFighter.isCarryied) {
			return false;
		}
		//if (tacklerFighter.status.statusId==96) { return false; } //UNTACKLABLE
		//if (tacklerFighter.status.statusId==6)	  { return false; } //ROOTED

		return true;
	}

	/**
	 ** Get tackle ratio of tackler on given fighter
	 * @param {int} fighter contextual id
	 * @param {object} tackler json
	 **/
	getTackleRatio(username, actor, tackler) {
		var evade = Math.max(0, accounts[username].plugins.Fighter.fighters[actor].stats.tackleEvade || 0);
		var block = Math.max(0, tackler.stats.tackleBlock || 0);
		return (evade + 2) / (block + 2) / 2;
	}
	
	
	
	
	/**
	 ** Returns cells that are marked with traps of glyphs
	 **/
	getMarkedCells(username) {
		var cellIds = {};
		for (var key in accounts[username].plugins.Fighter.marks[username]) { //looping through all recorded marks
			var mark = accounts[username].plugins.Fighter.marks[username][key];
			for (var j in mark.cells) {
				cellIds[mark.cells[j].cellId] = true;
			}
		}
		return cellIds;
	}
	
	isWalkable(username, cellId, isFightMode) {
		var mask = isFightMode ? 5 : 1;
		// console.log(store.getState().accounts[username].plugins.Map)
		return (accounts[username].plugins.Map.cells[cellId].l & mask) === 1;
	};
	
	/** Returns an array of cells a given fighter can reach
	 * @param {int}  fighter contextual id
	 * @param {int}  current cell id of fighter
	 **/
	getReachableZone(username, actor, currentCellId) {
		var movementZone = {};
		var fighterData = accounts[username].plugins.Fighter.fighters[actor];
		var stats = fighterData.stats;
		
		if(!stats) return {};
		
		var maxDistance = stats.movementPoints;
		if (maxDistance <= 0) {
			return movementZone;
		}

		var opened = [];
		var closed = {};

		var node = new PathNode(currentCellId, stats.movementPoints, stats.actionPoints, 0, 0, 1);
		opened.push(node);
		closed[currentCellId] = node;

		var occupiedCells = this.getIndexedVisibleActors(username);
		var markedCells = this.getMarkedCells(username);

		while (opened.length) { //looping through opened and deleting it
			var current = opened.pop();
			var cellId = current.cellId;
			var neighbours = getNeighbourCells(cellId, false);

			// get tacklers list
			var tacklers = [];
			var i = 0;
			var neighbour;
			while (i < neighbours.length) {
				neighbour = neighbours[i];
				var tackler = occupiedCells[neighbour];
				if (neighbour !== undefined && !tackler) {
					i++;
					continue;
				}
				neighbours.splice(i, 1); // cell is not walkable
				if (tackler) {
					tacklers.push(tackler);
				}
			}

			var tackleCost = this.getTackleCost(username, actor, tacklers, current.availableMp, current.availableAp);
			var availableMp = current.availableMp - tackleCost.mp - 1; // tackle cost + 1 mp to move
			var availableAp = current.availableAp - tackleCost.ap;
			var tackleMp = current.tackleMp + tackleCost.mp;
			var tackleAp = current.tackleAp + tackleCost.ap;
			var distance = current.distance + 1;
			var reachable = availableMp >= 0;

			if (markedCells[cellId] && currentCellId !== cellId) {
				availableMp = 0;
			}

			for (i = 0; i < neighbours.length; i++) {
				neighbour = neighbours[i];

				// this cell has already been checked.
				// see if new cost is better than previous one.
				if (closed[neighbour]) {
					var previous = closed[neighbour];
					// don't consider this path to this neighbour if available mp are less than previous path
					if (previous.availableMp > availableMp) {
						continue;
					}
					// if mp costs are the same, then test available ap
					if (previous.availableMp === availableMp && previous.availableAp >= availableAp) {
						continue;
					}
				}

				// cell is not walkable in fight
				if (!this.isWalkable(username, neighbour, true)) {
					continue;
				}

				movementZone[neighbour] = new MoveNode(tackleCost, cellId, reachable);
				node = new PathNode(neighbour, availableMp, availableAp, tackleMp, tackleAp, distance);
				closed[neighbour] = node;
				if (current.distance < maxDistance) {
					opened.push(node);
				}
			}
		}
		return movementZone;
	}
	
	async moveCloserTo(username, cellId, mp) {
		if (mp <= 1) {
			return false;
		}
		const account = accounts[username]; 
		var closest = cellId
		var closestDistance = 999
		const stats = account.plugins.Fighter.stats;
		mp = stats.movementPointsCurrent < mp ? stats.movementPointsCurrent : mp;
		var myCellId = account.plugins.Fighter.fighters[account.extra.selectedCharacter.id].disposition.cellId;
		var reachableZoneWTackle = this.getReachableZone(username, account.extra.selectedCharacter.id, myCellId);
		var reachableZone = {}
		for (var key in reachableZoneWTackle) {
			if (reachableZoneWTackle[key].ap == 0 && reachableZoneWTackle[key].mp == 0 && reachableZoneWTackle[key].reachable == true) reachableZone[key] = reachableZoneWTackle[key]
		}
		for (var i in reachableZone) {
			var distance = getCellDistance(i, cellId)
			if (distance < closestDistance) {
				// console.log(i)
				closestDistance = distance
				closest = i
			}
		}		
		
		return await plugins.Map.moveToCell(username, closest)
	}
	
	async moveAway(username) {
		const account = accounts[username]; 
		var highestDistance = 0;
		var highestDistanceCellId = 0;
		const me = account.plugins.Fighter.fighters[account.extra.selectedCharacter.id];
		const myCellId = me.disposition.cellId;
		const reachableZone = this.getReachableZone(username, account.extra.selectedCharacter.id, myCellId);
		const enemies = this.getAliveEnemies(username);
		for (var a in reachableZone) {
			if (reachableZone[a].reachable) {
				if (reachableZone[a].ap > 0) {
					// requires ap
				} else {
					// we can walk on there;
					var enemy = getClosestFighterOfCell(a, enemies);
					var distance = getCellDistance(a, enemy.disposition.cellId);
					if (distance >= highestDistance) {
						highestDistance = distance;
						highestDistanceCellId = a;
					}
				}
			}
		}
		if (highestDistanceCellId == 0) {
			return false;
		}
		
		
		return plugins.Map.moveToCell(username, highestDistanceCellId)
	}
	
	
	finishMyTurn(username) {
		accounts[username].socket.sendMessage("GameFightTurnFinishMessage");
	}
	
	castSpell(username, spell, cellId, fromCellId) {
		const connection = accounts[username].socket;
				
		connection.sendMessage("GameActionFightCastRequestMessage", {
			spellId: spell.id,
			cellId: cellId
		});
		
		return new Promise((resolve, reject)=>{
			connection.eventEmitter.once("PlayerCast", (payload) => {
				if(accounts[username].plugins.Fighter.config.auto){
					accounts[username].plugins.Fighter.spellsToUse[spell.id].castsThisTurn.push([fromCellId, cellId])
				} else {
					accounts[username].plugins.Fighter.spellsToUse[spell.id].castsThisTurn++
				}
				accounts[username].plugins.Fighter.spellsToUse[spell.id].currentCooldown = spell.spellLevel.minCastInterval;
				connection.eventEmitter.off("GameActionFightNoSpellCastMessage")
				resolve()
			})
			
			connection.eventEmitter.once("GameActionFightNoSpellCastMessage", (payload) => {
				connection.eventEmitter.off("PlayerCast")
				resolve(false)
			})
		})

	}
	
	/** 
	 ** Get minimum spell damage
	 **/
	getSpellEffectDamage(username, spell, fighter, impactCellId) {
		const fighterObject = accounts[username].plugins.Fighter;
		var fighterCellId = fighter.disposition.cellId;
		var fighterMaxLifePoints = fighter.stats.maxLifePoints;
		var distance = getCellDistance(impactCellId, fighterCellId);
		var stats = fighterObject.stats;
		var intelligence = stats.intelligence.alignGiftBonus + stats.intelligence.base + stats.intelligence.contextModif + stats.intelligence.objectsAndMountBonus;
		var fireDamageBonus = stats.fireDamageBonus.alignGiftBonus + stats.fireDamageBonus.base + stats.fireDamageBonus.contextModif + stats.fireDamageBonus.objectsAndMountBonus;
		var chance = stats.chance.alignGiftBonus + stats.chance.base + stats.chance.contextModif + stats.chance.objectsAndMountBonus;
		var waterDamageBonus = stats.waterDamageBonus.alignGiftBonus + stats.waterDamageBonus.base + stats.waterDamageBonus.contextModif + stats.waterDamageBonus.objectsAndMountBonus;
		var agility = stats.agility.alignGiftBonus + stats.agility.base + stats.agility.contextModif + stats.agility.objectsAndMountBonus;
		var airDamageBonus = stats.airDamageBonus.alignGiftBonus + stats.airDamageBonus.base + stats.airDamageBonus.contextModif + stats.airDamageBonus.objectsAndMountBonus;
		var strength = stats.strength.alignGiftBonus + stats.strength.base + stats.strength.contextModif + stats.strength.objectsAndMountBonus;
		var earthDamageBonus = stats.earthDamageBonus.alignGiftBonus + stats.earthDamageBonus.base + stats.earthDamageBonus.contextModif + stats.earthDamageBonus.objectsAndMountBonus;
		var neutralDamageBonus = stats.neutralDamageBonus.alignGiftBonus + stats.neutralDamageBonus.base + stats.neutralDamageBonus.contextModif + stats.neutralDamageBonus.objectsAndMountBonus;
		var allDamagesBonus = stats.allDamagesBonus.alignGiftBonus + stats.allDamagesBonus.base + stats.allDamagesBonus.contextModif + stats.allDamagesBonus.objectsAndMountBonus;
		var damagesBonusPercent = stats.damagesBonusPercent.alignGiftBonus + stats.damagesBonusPercent.base + stats.damagesBonusPercent.contextModif + stats.damagesBonusPercent.objectsAndMountBonus;
		var finalDamage = 0;
		var spellLevel = spell.spellLevel;
		var spellLevelId = spellLevel.id;
		for (var i = 0; i < spellLevel.effects.length; i++) {

			var damage = 0;
			var type = 0;
			var effect = spellLevel.effects[i];
			var tmpDamage = (effect.diceSide ? (effect.diceNum + effect.diceSide) / 2 : effect.diceNum);
			if (elementEffects.waterEffects.indexOf(effect.effectId) != -1) {
				damage += tmpDamage * (100 + chance + damagesBonusPercent) / 100 + waterDamageBonus;
				damage = this.applyFighterResistance(damage, fighter, "water");
			} else if (elementEffects.earthEffects.indexOf(effect.effectId) != -1) {
				damage += tmpDamage * (100 + strength + damagesBonusPercent) / 100 + earthDamageBonus;
				damage = this.applyFighterResistance(damage, fighter, "earth");
			} else if (elementEffects.airEffects.indexOf(effect.effectId) != -1) {
				damage += tmpDamage * (100 + agility + damagesBonusPercent) / 100 + airDamageBonus;
				damage = this.applyFighterResistance(damage, fighter, "air");
			} else if (elementEffects.fireEffects.indexOf(effect.effectId) != -1) {
				damage += tmpDamage * (100 + intelligence + damagesBonusPercent) / 100 + fireDamageBonus;
				damage = this.applyFighterResistance(damage, fighter, "fire");
			} else if (elementEffects.neutralEffects.indexOf(effect.effectId) != -1) {
				damage += tmpDamage * (100 + strength + damagesBonusPercent) / 100 + neutralDamageBonus;
				damage = this.applyFighterResistance(damage, fighter, "neutral");
			}
			finalDamage += damage * (10 - distance) / 10;
		}
		return finalDamage;
	}

	/** 
	 ** Applies resistances of a fighter on given damage according to its type
	 **/
	applyFighterResistance(damage, fighter, type) {
		var neutralResistance = fighter.stats.neutralElementResistPercent;
		var neutralReduction = fighter.stats.neutralElementReduction;
		var fireResistance = fighter.stats.fireElementResistPercent;
		var fireReduction = fighter.stats.fireElementReduction;
		var earthResistance = fighter.stats.earthElementResistPercent;
		var earthReduction = fighter.stats.earthElementReduction;
		var waterResistance = fighter.stats.waterElementResistPercent;
		var waterReduction = fighter.stats.waterElementReduction;
		var airResistance = fighter.stats.airElementResistPercent;
		var airReduction = fighter.stats.airElementReduction;
		var reduction = 0;
		var resistance = 0;
		switch (type) {
			case "water":
				reduction = waterReduction;
				resistance = waterResistance;
				break;
			case "fire":
				reduction = fireReduction;
				resistance = fireResistance;
				break;
			case "earth":
				reduction = earthReduction;
				resistance = earthResistance;
				break;
			case "air":
				reduction = airReduction;
				resistance = airResistance;
				break;
			case "neutral":
				reduction = neutralReduction;
				resistance = neutralResistance;
				break;
		}
		var realDamage = damage - reduction - (damage - reduction) * (resistance / 100);
		return realDamage;
	}
	
	/**
	 ** Returns number of fighters that exist in an array of cells
	 **/
	getFightersFromTeamInZone(username, zone, teamId) {
		const fighterObject = accounts[username].plugins.Fighter;
		const fighters = fighterObject.fighters;
		var retFighters = [];
		for (const index in fighters) {
			const fighter = fighters[index];
			if (zone.indexOf(fighter.disposition.cellId) != -1 && fighter.teamId == teamId && fighter.alive && fighter.stats.lifePoints > 0) {
				retFighters.push(fighter);
			}
		}
		return retFighters;
	}
	/**
	 ** Returns number of allies that exist in an array of cells
	 **/
	getAlliesInZone(username, zone) {
		const fighterObject = accounts[username].plugins.Fighter;
		return this.getFightersFromTeamInZone(username, zone, fighterObject.teamId == 0 ? 0 : 1);
	}

	/**
	 ** Returns number of enemies that exist in an array of cells
	 **/
	getEnemiesInZone(username, zone) {
		const fighterObject = accounts[username].plugins.Fighter;
		return this.getFightersFromTeamInZone(username, zone, fighterObject.teamId == 0 ? 1 : 0);
	}
	
	
	/** Return the range of a circle perimeter area (effect type 'O')
	 *  The function is based on shapeRing, replacing the radiusMin by radiusMax.
	 */
	getSpellEffectZoneO(username, cellsData, caster, target, effect) {
		const fighterObject = accounts[username].plugins.Fighter;
		function CellInfo(cellId, distanceToPlayer, transformState) {
			this.cellId = cellId;
			this.distanceToPlayer = distanceToPlayer;

			this.transformState = transformState;
		}

		var cellInfos = {};
		var shaper = shaperMap[effect.zoneShape];
		if (!shaper) {
			if (shaper === undefined) {
				console.error('Incorrect Effect shape id: ' + effect.zoneShape);
			}
			//TODO: simplify this by filling out the undefined shapes in shaperMap.
			cellInfos[target] =
				new CellInfo(
					target,
					0,
					fighterObject.ourTurn ? transformStates.areaOfEffect : transformStates.areaOfEffectEnemyTurn
				);
		} else {
			var targetCoords = getMapPointFromCellId(target);
			var dirX, dirY;
			if (shaper.hasDirection) {
				var casterCoords = getMapPointFromCellId(caster);
				dirX = targetCoords.x === casterCoords.x ? 0 : targetCoords.x > casterCoords.x ? 1 : -1;
				dirY = targetCoords.y === casterCoords.y ? 0 : targetCoords.y > casterCoords.y ? 1 : -1;
			}
			var radiusMin = shaper.withoutCenter ? effect.zoneMinSize || 1 : effect.zoneMinSize; // ಠ_ಠ
			var rangeCoords = shaper.fn(targetCoords.x, targetCoords.y, radiusMin, effect.zoneSize, dirX, dirY);
			// Add this cell only if los bitflag is set as follow:
			// - bit 1 (isWalkable)			 === 1
			// - bit 3 (nonWalkableDuringFight) === 0
			for (var i = 0; i < rangeCoords.length; i++) {
				var cellId = getCellIdFromMapPoint(rangeCoords[i][0], rangeCoords[i][1]);

				if (cellId === undefined) {
					continue;
				}
				var los = cellsData[cellId].l || 0;
				if ((los & 5) === 1) {
					cellInfos[cellId] =
						new CellInfo(
							cellId,
							rangeCoords[i][2],
							fighterObject.ourTurn ?
							transformStates.areaOfEffect :
							transformStates.areaOfEffectEnemyTurn
						);
				}
			}
		}
		return cellInfos;
	};

	/** returns an array of cells that are in the effect zone of the spell
	 * @param {int} fromCellId : the cellId from where the spell would be casted
	 * @param {int} toCellId : the cellId of the impact
	 **/
	getSpellEffectZone(username, spell, fromCellId, toCellId) {
		var zone = this.getSpellEffectZoneO(username, accounts[username].plugins.Map.cells, fromCellId, toCellId, n(spell.spellLevel.effects[0].rawZone));
		var cells = [];
		for (var cell in zone) {
			cells.push(parseInt(cell));
		}
		return cells;
	}

	
	getFormattedTargetCellData(username, spell, fromCellId, toCellId, mpCost, spellType = "damage") {
		
		var nbEnemies = 0;
		var nbAllies = 0;
		var ratio = 0;
		
			var spellLevel = spell.spellLevel;
			var spellEffectZone = this.getSpellEffectZone(username, spell, fromCellId, toCellId);		
			
			if(spellType == "boost") return {cellId: toCellId, nbAllies: this.getAlliesInZone(username, spellEffectZone).length, fromCellId}
			
			var enemies = this.getEnemiesInZone(username, spellEffectZone);
			nbEnemies = enemies.length;
			if(nbEnemies == 0) return {ratio: 0}
			nbAllies = this.getAlliesInZone(username, spellEffectZone).length;
			
			var spellEffectRatio = 0;
			var totalSpellEffectDamage = 0;
			for (var i = 0; i < enemies.length; i++) {
				var spellEffectDamage = this.getSpellEffectDamage(username, spell, enemies[i], toCellId);				
				totalSpellEffectDamage += spellEffectDamage;
				var r = spellEffectDamage / 100;
				var fighterLifePoints = enemies[i].stats.lifePoints;
				if (spellEffectDamage >= fighterLifePoints) {
					r = fighterLifePoints / 100 + ratios.killRatio;
				}
				if (enemies[i].stats.summoned) r -= isSummonRatio //NotSummonRatio
				spellEffectRatio += r;
			}
			var k = nbAllies * ratios.allyRatio;
			var spellCostRatio = totalSpellEffectDamage / Math.pow(spellLevel.apCost, 3);
			
			var distance = 0;
			if(this.getActorOnCell(username, toCellId)){
				var distance = getCellDistance(toCellId, fromCellId)
				if(accounts[username].plugins.Fighter.config.berserker) distance = -distance;
			}
			ratio = nbEnemies - k + spellEffectRatio + spellCostRatio + distance/10 -  mpCost/10;
			ratio = ratio < 0 ? 0 : ratio;
			

		
		return {
			cellId: toCellId,
			nbAllies: nbAllies,
			nbEnemies: nbEnemies,
			ratio: ratio,
			fromCellId: fromCellId
		}
	}
	
	getSpellSightOfViewAtCell(username, myCellId, spell) {
		const spellData = spell.spellLevel;
		const map=accounts[username].plugins.Map
		if (map && map.cells && spellData) {
			const mapCells = map.cells;
			const spellRange = getSpellRange(mapCells, myCellId, spellData);
			const visibleActors = this.getIndexedVisibleActors(username);
			var a = [];
			for (var f = 0; f < spellRange.length; f++) {
				var cellId = getCellIdFromMapPoint(spellRange[f][0], spellRange[f][1]);

				if (void 0 !== cellId && a.indexOf(cellId) == -1) {
					if (spellData.needFreeCell && visibleActors[cellId]) {
						//a.push(cellId);
						//CHECK THIS IF FIGHT BUGS
					} else {
						if (mapCells[cellId] == undefined) continue;
						var _ = mapCells[cellId].l || 0;
						if (3 === (7 & _)) {
							a.push(cellId);
						}
					}
				}
			}
			if (spellData.castTestLos) {
				a = testLos(mapCells, a, myCellId, visibleActors);
			}
			return a;
		}
	}

	
	
	
	getWhatSpellToCast(username) {
		
		const account = accounts[username]; 
		const stats = account.plugins.Fighter.stats;
		const me = account.plugins.Fighter.fighters[account.extra.selectedCharacter.id];

		if (!me) {
			return false;
		}
		
		const reachableZoneWTackle = this.getReachableZone(username, account.extra.selectedCharacter.id, me.disposition.cellId);
		var reachableZone = {
			[me.disposition.cellId]: {
				ap: 0,
				reachable: true
			}
		}
		for (const key in reachableZoneWTackle) {
			if (reachableZoneWTackle[key].ap == 0 && reachableZoneWTackle[key].mp == 0 && reachableZoneWTackle[key].reachable == true) reachableZone[key] = reachableZoneWTackle[key]
		}
		
		var bestData = {
			ratio: 0,
			nbAllies: 0,
			nbEnemies: 0,
			spell: {
				name: "Aucun sort"
			}
		}
		
		if(!account.plugins.Fighter.config.auto){
			const instructions = account.plugins.Fighter.config.instructions[account.extra.selectedCharacter.breed] || []
			
			if(instructions.length == 0){
				sendToBrowser("LOG", {
					username,
					html: "<p class='warn'>ATTENTION: Vous êtes en mode manuel mais vous n'avez choisi aucune instruction, changement en mode AUTOMATIQUE.</p>"
				})
				account.plugins.Fighter.config.auto = true;
				this.autoModeInit(username);
			} else {
				for(const instruction of instructions){
					const spell = account.plugins.Fighter.spells.find(e=>e.id == instruction.spellId);
					if(account.plugins.Fighter.spellsToUse[instruction.spellId].castsThisTurn >= instruction.repeat || account.plugins.Fighter.spellsToUse[instruction.spellId].error || spell.spellLevel.apCost > stats.actionPointsCurrent || account.plugins.Fighter.spellsToUse[instruction.spellId].currentCooldown > 0) continue;
					
					var cellId;
					if(instruction.toCellId.includes("enemy")){
						const enemies = this.getAliveEnemies(username);
						const sight = this.getSpellSightOfViewAtCell(username, me.disposition.cellId, spell);
						// cellId = getClosestFighterOfCell(me.disposition.cellId, enemies).disposition.cellId;
						for(const id in enemies){
							if(sight.includes(enemies[id].disposition.cellId)){
								cellId = enemies[id].disposition.cellId;
								break;
							}
						}
					} else if(instruction.toCellId.includes("ally")) {
						const allies = this.getAliveAllies(username);
						cellId = getClosestFighterOfCell(me.disposition.cellId, allies).disposition.cellId;
					} else if(instruction.toCellId.includes("self")) {
						cellId = me.disposition.cellId
					}
					
					if(!cellId) continue;
					
					if(instruction.toCellId.includes("Next")){
						const sight = this.getSpellSightOfViewAtCell(username, me.disposition.cellId, spell);
						const neighbours = getNeighbourCells(cellId, false).filter(cell => sight.includes(cell));
						if(neighbours.length == 0) continue;
						cellId = neighbours[0]
					}
					
					if(getCellDistance(me.disposition, getClosestFighterOfCell(me.disposition.cellId, this.getAliveEnemies(username)).disposition.cellId) > 1 && instruction.cacOnly) continue;
					if(spell.spellLevel.range < getCellDistance(me.disposition, cellId)) continue;
					
					// log.warn(username, `${spell.name}: ${cellId}`)
					
					return {
						cellId,
						fromCellId: me.disposition.cellId,
						spell
					}
				}
				return false;
			}
		}
		for (const id in account.plugins.Fighter.spellsToUse) {
			const spell = account.plugins.Fighter.spells.find(e => e.id == id);
			// if (!spell) continue;
			var conditions = [
				account.plugins.Fighter.spellsToUse[id].currentCooldown <= 0,
				account.plugins.Fighter.spellsToUse[id].castsThisTurn.length < spell.spellLevel.maxCastPerTurn || spell.spellLevel.maxCastPerTurn == 0,
				stats.actionPointsCurrent >= spell.spellLevel.apCost
			]
			
			if (conditions.indexOf(false) != -1) {
				continue;
			}
			
			
			//Checking if the spell was already cast this turn and evaluate if it should be cast again to save processing time:
			const length = account.plugins.Fighter.spellsToUse[id].castsThisTurn.length
			if(length > 0){
				const actor = this.getActorOnCell(username, account.plugins.Fighter.spellsToUse[id].castsThisTurn[length - 1][1]);
				
				var conditions = [
					actor,
					actor.teamId != account.plugins.Fighter.teamId,
					account.plugins.Fighter.spellsToUse[id].castsThisTurn.filter(e => e[1] == account.plugins.Fighter.spellsToUse[id].castsThisTurn[length - 1][1]).length < spell.spellLevel.maxCastPerTarget || spell.spellLevel.maxCastPerTarget == 0,
					spell.spellLevel.effects.filter(e => effects[e.effectId].category == 2).length > 0,
					account.plugins.Fighter.spellsToUse[id].currentCooldown == 0
				]
				
				
				if(conditions.indexOf(false) == -1){
					bestData = {
						cellId: account.plugins.Fighter.spellsToUse[id].castsThisTurn[length - 1][1],
						fromCellId: account.plugins.Fighter.spellsToUse[id].castsThisTurn[length - 1][0],
						spell
					}
					console.log(`${spell.name}: spell was already used and is valid to use again.`)
					return bestData
				}
			}
			
			
			// console.log("parsing spell data")
			//PARSING THE SPELL DATA
			if(!spell.spellLevel.effects.filter(e => effects[e.effectId].category == 2).length > 0){ //if is not damage
				if (n(spell.spellLevel.effects[0].rawZone).zoneShape != "P") { //zoned spell
					console.log(`${spell.name} (not damage): spell is zoned, picking setup with most allies.`)
					for (var fromCellId in reachableZone) {
						fromCellId = parseInt(fromCellId)
						
						if (!reachableZone[fromCellId].reachable || reachableZone[fromCellId].ap > 0) {
							continue;
						}
						
						const sight = this.getSpellSightOfViewAtCell(username, fromCellId, spell);
						var distance = 999;
						for (const cellId of sight) {
							const data = this.getFormattedTargetCellData(username, spell, fromCellId, cellId, 0, "boost");
							
							const d = getCellDistance(cellId, fromCellId);
							if(data.nbAllies > bestData.nbAllies || (d < distance && data.nbAllies == bestData.nbAllies)) {
								bestData = data
								distance = d
							}
						}
					}
					
					bestData.spell = spell
					return bestData;
				}
				
				if (spell.spellLevel.minRange == 0) { //is self targetable
					console.log(`${spell.name} (not damage): spell is self targetable, casting on self.`)
					return {
						cellId: me.disposition.cellId,
						fromCellId: me.disposition.cellId,
						spell
					}
				} else {
					console.log(`${spell.name} (not damage): spell is not zoned and not self targetable, certainly a summon, casting to the closest enemy possible.`)
					const enemies = this.getAliveEnemies(username);
					const closest = this.getClosestFighterOfCell(me.disposition.cellId, enemies).disposition.cellId;
					const sight = this.getSpellSightOfViewAtCell(username, me.disposition.cellId, spell);
					const occupiedCells = this.getIndexedVisibleActors(username);
					var distance = 999;
					var toCellId = -1;
					for (const cellId of sight) {
						const d = getCellDistance(cellId, closest);
						if(d < distance && d != 0 && !occupiedCells.includes(cellId)){
							distance = d;
							toCellId = cellId
						}
					}

					return {
						cellId: toCellId,
						fromCellId: me.disposition.cellId,
						spell
					}
				}
			} else {//is damage
				for (var cellId in reachableZone) {
					cellId = parseInt(cellId)
					if (!reachableZone[cellId].reachable || reachableZone[cellId].ap > 0) {
						continue;
					}
					const sight = this.getSpellSightOfViewAtCell(username, cellId, spell);
					for (const toCellId of sight) {					
						// console.log("before")
						if(length > 0 && account.plugins.Fighter.spellsToUse[id].castsThisTurn.filter(e => e[1] == toCellId).length >= spell.spellLevel.maxCastPerTarget && spell.spellLevel.maxCastPerTarget != 0) continue;
						// console.log("after")
						const data = this.getFormattedTargetCellData(username, spell, cellId, toCellId, getCellDistance(cellId, me.disposition.cellId));
						if (data.ratio > bestData.ratio) {
							bestData = data
							bestData.spell = spell
						}
					}
					
				}
					
				
				// return (bestData.ratio > 0) ? bestData : false;
			}
		}
		
		return (bestData.ratio > 0) ? bestData : false

	}
	
	
	async fight(username) {
		const account = accounts[username];
		
		const connection = account.socket;
		const fighterObject = account.plugins.Fighter;
		
		const everyone = fighterObject.fighters;
		const me = everyone[account.extra.selectedCharacter.id];
		
		if (!fighterObject.ourTurn || !me || this.getAliveEnemies(username).length == 0) {
			return;
		}
		
		if (fighterObject.stats.actionPointsCurrent < 2 && fighterObject.stats.movementPointsCurrent <= 0) {
			console.log("["+username+"]:  Ending turn because i have no action points or movement points left")
			return this.finishMyTurn(username)
		}
		
		
		const data = this.getWhatSpellToCast(username);
		
		if (data.spell && data.cellId && data.fromCellId) {
			console.log("Casting", data.spell.name, "from", data.fromCellId, "on", data.cellId, ". Ratio:", data.ratio)
			if (data.fromCellId == me.disposition.cellId) {
				// cast spell
				// await sleep(delay)
				await this.castSpell(username, data.spell, data.cellId, data.fromCellId);
				

			} else {
				// move and cast spell
				console.log("["+username+"]:  moving to cast:", data.fromCellId)
				/*const reachableZoneWTackle = await this.getReachableZone(username, account.extra.selectedCharacter.id, me.disposition.cellId);
				const reachableZone = {}
				for (var key in reachableZoneWTackle) {
					if (reachableZoneWTackle[key].ap == 0 && reachableZoneWTackle[key].mp == 0 && reachableZoneWTackle[key].reachable == true) reachableZone[key] = reachableZoneWTackle[key]
				}*/
				
				const moved = await plugins.Map.moveToCell(username, data.fromCellId)
				
				if(moved){
					// await sleep(delay)
					this.castSpell(username, data.spell, data.cellId, data.fromCellId);
				} else console.log("Didn't move");
				
			}
			return;
		}

		const stats = fighterObject.stats;
		const enemies = this.getAliveEnemies(username);
		const closest = getClosestFighterOfCell(me.disposition.cellId, enemies);

		if (!closest) {
			return;
		}
		const closestCellId = closest.disposition.cellId;
		const distance = getCellDistance(me.disposition.cellId, closestCellId);
		if (stats.movementPointsCurrent > 0) {
			// console.log(this.berserker[username])
			if (!fighterObject.config.berserker && distance < fighterObject.config.maxDistance) {
				if (stats.actionPointsCurrent > 1) {
					console.log("["+username+"]:  Moving closer to: ", closestCellId, stats.movementPointsCurrent)
					var moved = await this.moveCloserTo(username, closestCellId, distance)
					if (moved == true) {
						console.log("["+username+"]:  Moved closer")
						return await this.fight(username)
					}
				}
				var moved = await this.moveAway(username)
				if (moved == true) {
					console.log("["+username+"]:  Moved Away")
					return await this.fight(username);
				}
			} else {
				console.log("["+username+"]:  Moving closer to: ", closestCellId, stats.movementPointsCurrent)
				var moved = await this.moveCloserTo(username, closestCellId, distance)
				if (moved == true) {
					console.log("["+username+"]:  Moved closer")
					return await this.fight(username);
				}
			}
		}
		this.finishMyTurn(username);
	}
	
	autoModeInit(username){
		const account = accounts[username]
		const fighterObject = account.plugins.Fighter
		
		global.accounts[username].plugins.Fighter.spellsToUse = {};
		
		var maxDistance = 1;
		var damage;
		for(const spell of fighterObject.spells){
			const filterFunction = function(e) {
				if(fighterObject.bestElement.effects.includes(e.effectId) && effects[e.effectId].category == 2 && !effects[e.effectId].descriptionId.includes("PV rendus")) damage = true;
				return (fighterObject.bestElement.effects.includes(e.effectId) && effects[e.effectId].category == 2 && !effects[e.effectId].descriptionId.includes("PV rendus")) || //is our element and is damage
					(e.effectId == 788 && spell.name.includes(fighterObject.bestElement.chatiment)) || //OR is our element chatiment
					alwaysChooseSpells.includes(spell.name) //OR is a must-have spell
			}
			if(spell.spellLevel.effects.filter(filterFunction).length > 0){ //category == 2 == damage
				global.accounts[username].plugins.Fighter.spellsToUse[spell.id] = {
					currentCooldown: spell.spellLevel.initialCooldown,
					castsThisTurn: []
				}
				
				if(spell.spellLevel.range - 1 > maxDistance) maxDistance = spell.spellLevel.range - 1;
			}
			
		}
		
		if(Object.keys(fighterObject.spellsToUse).length == 0 || !damage){
			console.log("I have no spell that hits with my strongest element, i'll be choosing the most powerful spell from other elements")
			var damage = 0
			var chatiment;
			var spellsDetected = {}
			if(Object.keys(fighterObject.spellsToUse).length != 0) spellsDetected = fighterObject.spellsToUse;
			for(const spell of fighterObject.spells){
				const spellLevel = spell.spellLevel;
				for (var i = 0; i < spellLevel.effects.length; i++) {
					const effect = spellLevel.effects[i];
					if(elementsEffects.neutralEffects.includes(effect.effectId) || effects[effect.effectId].category != 2 || effects[effect.effectId].descriptionId.includes("PV rendus")) continue;
					
					// if((effect.diceSide ? (effect.diceNum + effect.diceSide)/2 : effect.diceNum)/spellLevel.apCost > damage){
						
						/*global.accounts[username].plugins.Fighter.spellsToUse = {
							[spell.id]: {
								currentCooldown: spell.spellLevel.initialCooldown,
								castsThisTurn: []
							}
						}*/
						
						global.accounts[username].plugins.Fighter.spellsToUse[spell.id] = {
							
								currentCooldown: spell.spellLevel.initialCooldown,
								castsThisTurn: []
							
						}
						
						/*const chatimentElement = Object.keys(elementEffects).find(e => elementEffects[e] == Object.values(elementEffects).find(e => e.includes(effect.effectId)))
						// console.log(chatimentElement)
						if(chatimentElement){
							chatiment = fighterObject.spells.find(e => e.name == ("Châtiment " + chati[chatimentElement]));
							// console.log(chati[chatimentElement])
						}*/
						// damage = (effect.diceSide ? (effect.diceNum + effect.diceSide)/2 : effect.diceNum)/spellLevel.apCost
						if(spell.spellLevel.range - 1 > maxDistance) maxDistance = spell.spellLevel.range - 1;
					// }
				}
			}	
			if(chatiment){
				global.accounts[username].plugins.Fighter.spellsToUse[chatiment.id] = {
					currentCooldown: chatiment.spellLevel.initialCooldown,
					castsThisTurn: []
				}
			}
			
			for(const id in spellsDetected) global.accounts[username].plugins.Fighter.spellsToUse[id] = spellsDetected[id];
			
				
			
		}
			
		global.accounts[username].plugins.Fighter.config.maxDistance = maxDistance + 3;
		global.accounts[username].plugins.Fighter.config.berserker = (maxDistance == 1);
		
		var debug = "";
		for(const id in fighterObject.spellsToUse) debug += `, ${fighterObject.spells.find(e => e.id == id).name}`
		log.warn(username, `[MODE AUTOMATIQUE] Le joueur va utiliser les sorts suivants: <span style='color:white;'>${debug.slice(2)}</span>`)
		if(!accounts[username].plugins.Fighter.config.berserker) log.warn(username, `[MODE AUTOMATIQUE] Mode de jeu: <span style='color:white;'>Distance</span>. Distance max: <span style='color:white;'>${accounts[username].plugins.Fighter.config.maxDistance}</span>`)
		else log.warn(username, `[MODE AUTOMATIQUE] Mode de jeu: <span style='color:white;'>CAC</span>`)
	}
}