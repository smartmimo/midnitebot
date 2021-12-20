const accounts = require("./data.json"); //my cell: 370/ enemy cell: 384, 450
 //my cell: 370/ enemy cell: 384, 450
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
	
	const effects = require("../../Assets/effects.json");

const elementEffects = {
	"waterEffects": "[85, 91, 96, 123, 152, 275, 426, 1014, 1065, 1068, 1095, 1121, 1127, 1132, 1137]",
	"earthEffects": "[86, 92, 97, 118, 157, 276, 422, 1122, 1128, 1140]",
	"airEffects": "[87, 93, 98, 119, 277, 428, 1013, 1064, 1067, 1093, 1119, 1125, 1131, 1136]",
	"fireEffects": "[88, 94, 99, 108, 126, 155, 278, 424, 1015, 1037, 1066, 1069, 1094, 1120, 1126, 1133, 1138]",
	"neutralEffects": "[82, 89, 95, 100, 143, 144, 279, 430, 670, 671, 672, 1012, 1071, 1092, 1109, 1118, 1124, 1134, 1139]",

	"boostEffects": "[108, 110, 111, 112, 114, 115, 117, 118, 119, 120, 121, 123, 124, 125, 126, 128, 136, 137, 138, 142, 158, 160,161, 752, 753, 165, 174, 176, 178, 182, 183, 184, 776, 788, 210, 211, 212, 213, 214, 240, 241, 242, 243,244, 250, 251, 252, 253, 254, 260, 261, 262, 263, 264, 1039, 1040, 281, 282, 283, 284, 285, 286, 287,288, 289, 290, 291, 292, 293, 1054]"

}
class fight {
	constructor(){
		this.allyRatio = 0.5;
		this.killRatio = 6;
		this.isSummonRatio = 0.7
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

	
	getFormattedTargetCellData(username, spell, fromCellId, toCellId, spellType = "damage") {
		
		var nbEnemies = 0;
		var nbAllies = 0;
		var ratio = 0;
		
			var spellLevel = spell.spellLevel;
			var spellEffectZone = this.getSpellEffectZone(username, spell, fromCellId, toCellId);		
			
			if(spellType == "boost") return {cellId: toCellId, nbAllies: this.getAlliesInZone(username, spellEffectZone).length, fromCellId}
			
			var enemies = this.getEnemiesInZone(username, spellEffectZone);
			nbEnemies = enemies.length;
			nbAllies = this.getAlliesInZone(username, spellEffectZone).length;
			
			var spellEffectRatio = 0;
			var totalSpellEffectDamage = 0;
			for (var i = 0; i < enemies.length; i++) {
				var spellEffectDamage = this.getSpellEffectDamage(username, spell, enemies[i], toCellId);
				totalSpellEffectDamage += spellEffectDamage;
				var r = spellEffectDamage / 100;
				var fighterLifePoints = enemies[i].stats.lifePoints;
				if (spellEffectDamage >= fighterLifePoints) {
					r = fighterLifePoints / 100 + this.killRatio;
				}
				if (enemies[i].stats.summoned) r -= this.isSummonRatio //NotSummonRatio
				spellEffectRatio += r;
			}
			var k = nbAllies * this.allyRatio;
			var spellCostRatio = totalSpellEffectDamage / Math.pow(spellLevel.apCost, 3);

			ratio = nbEnemies - k + spellEffectRatio + spellCostRatio;
			ratio = ratio < 0 ? 0 : ratio;
			

		return {
			cellId: toCellId,
			nbAllies: nbAllies,
			nbEnemies: nbEnemies,
			ratio: ratio,
			fromCellId: fromCellId
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
		for (var key in reachableZoneWTackle) {
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

		for (const id in account.plugins.Fighter.spellsToUse) {
			const spell = account.plugins.Fighter.spells.find(e => e.id == id);
			// if (!spell) continue;
			const conditions = [
				account.plugins.Fighter.spellsToUse[id].currentCooldown > 0,
				account.plugins.Fighter.spellsToUse[id].castsThisTurn.length >= spell.spellLevel.maxCastPerTurn,
				stats.actionPointsCurrent < spell.spellLevel.apCost
			]
			if (conditions.indexOf(true) != -1) {
				continue;
			}

			//PARSING THE SPELL DATA
			if(!spell.spellLevel.effects.filter(e => effects[e.effectId].category == 2).length > 0){ //if is not damage
				if (n(spell.spellLevel.effects[0].rawZone).zoneShape != "P") { //zoned spell
					console.log(`${spell.name}: spell is zoned, picking setup with most allies.`)
					for (var cellId in reachableZone) {
					cellId = parseInt(cellId)
						if (!reachableZone[cellId].reachable || reachableZone[cellId].ap > 0) {
							continue;
						}
						
						const sight = this.getSpellSightOfViewAtCell(username, fromCellId, spell);
						for (const cellId of sight) {
							const nbAllies = this.getFormattedTargetCellData(username, spell, fromCellId, cellId, "boost");
							if (data.nbAllies > bestData.nbAllies) {
								bestData = data
							}
						}
					}
					
					bestData.spell = spell
					return bestData;
				}
				
				if (spell.spellLevel.minRange == 0) { //is self targetable
					console.log(`${spell.name}: spell is self targetable, casting on self.`)
					data = this.getFormattedTargetCellData(username, spell, me.disposition.cellId, me.disposition.cellId, "boost");
					return {
						cellId: me.disposition.cellId,
						fromCellId: me.disposition.cellId,
						spell
					}
				} else {
					console.log(`${spell.name}: spell is not zoned and not self targetable, certainly a summon, casting to the closest enemy possible.`)
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
						const data = this.getFormattedTargetCellData(username, spell, cellId, toCellId);
						console.log(data)
						if (data.ratio > bestData.ratio) {
							bestData = data
							bestData.spell = spell
						}
					}
					
					console.log("["+username+"]:  Finished processing ", spell.name, " Best spell so far: ", bestData.spell.name, bestData.ratio)
				}
					
				
				return (bestData.ratio > 0) ? bestData : false;
			}
		}
	
		return false

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
	
	async fight(username) {
		const account = accounts[username];
		const connection = account.socket;
		const fighterObject = account.plugins.Fighter;
		
		const everyone = fighterObject.fighters;
		const me = everyone[account.extra.selectedCharacter.id];
		
		if (!fighterObject.ourTurn || !me) {
			return;
		}
		
		if (fighterObject.stats.actionPointsCurrent < 2 && fighterObject.stats.movementPointsCurrent <= 0) {
			console.log("["+username+"]:  Ending turn because i have no action points or movement points left")
			return this.finishMyTurn(username)
		}
		
		
		const data = this.getWhatSpellToCast(username);
		// console.debug("["+username+']: ---SPELL TO CAST---', data.spell);
		if (data.spell && data.cellId && data.fromCellId) {
			// console.log("["+username+"]:  Got data")
			if (data.fromCellId == me.disposition.cellId) {
				// cast spell
				await sleep(delay)
				await this.castSpell(username, data.spell, data.cellId, data.fromCellId);
				

			} else {
				// move and cast spell
				console.log("["+username+"]:  moving to cast")
				/*const reachableZoneWTackle = await this.getReachableZone(username, account.extra.selectedCharacter.id, me.disposition.cellId);
				const reachableZone = {}
				for (var key in reachableZoneWTackle) {
					if (reachableZoneWTackle[key].ap == 0 && reachableZoneWTackle[key].mp == 0 && reachableZoneWTackle[key].reachable == true) reachableZone[key] = reachableZoneWTackle[key]
				}*/
				
				const moved = await plugins.Map.moveToCell(username, data.fromCellId)
				if(moved){
					await sleep(delay)
					this.castSpell(username, data.spell, data.cellId, data.fromCellId);
				}
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
			if (!fighterObject.berserker && distance < fighterObject.config.maxDistance) {
				if (stats.actionPointsCurrent > 1) {
					console.log("["+username+"]:  Moving closer to: ", closestCellId)
					var moved = await this.moveCloserTo(username, closestCellId, distance)
					if (moved == true) {
						console.log("["+username+"]:  Moved closer")
						return await this.fight(username)
					}
				}
				var moved = await this.moveAway(username)
				if (moved == true) {
					return await this.fight(username);
				}
			} else {
				console.log("["+username+"]:  Moving closer to: ", closestCellId)
				var moved = await this.moveCloserTo(username, closestCellId, distance)
				if (moved == true) {
					return await this.fight(username);
				}
			}
		}
		this.finishMyTurn(username);
	}
}

const i = new fight();
// console.log(i.getFormattedTargetCellData("zab", accounts["zab"].plugins.Fighter.spells.find(e=>e.id==432), 370, 384))
// i.getWhatSpellToCast("zab")
i.fight("zab")
// console.log(fighterObject.fighters)