const {
    getClosestFighterOfCell,
    getCellDistance
} = require("./util.js");

const log = {
    success: (username, msg, debug = false) => { if (!debug || (!debug || (debug && accounts[username].plugins.Fighter.config.debug == true))) sendToBrowser("LOG", { username, html: `<p class='success'>${msg}</p>` }) },
    info: (username, msg, debug = false) => { if (!debug || (debug && accounts[username].plugins.Fighter.config.debug == true)) sendToBrowser("LOG", { username, html: `<p class='info'>${msg}</p>` }) },
    warn: (username, msg, debug = false) => { if (!debug || (debug && accounts[username].plugins.Fighter.config.debug == true)) sendToBrowser("LOG", { username, html: `<p class='warn'>${msg}</p>` }) },
    error: (username, msg, debug = false) => { if (!debug || (debug && accounts[username].plugins.Fighter.config.debug == true)) sendToBrowser("LOG", { username, html: `<p class='error'>${msg}</p>` }) }
}

const effects = require("../../Assets/effects.json");
const spells = require("../../Assets/spells.json");
const monsters = require("../../Assets/monsters.json");

const delay = 100;

function format(n) {
    return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
}

module.exports = class Events {
    constructor() {
        this.listeners = [
            this.GameFightStartingMessage,
            this.GameFightPlacementPossiblePositionsMessage,
            this.GameEntitiesDispositionMessage,
            this.GameFightEndMessage,
            this.GameFightTurnStartMessage,
            this.GameActionFightNoSpellCastMessage,
            this.GameFightNewRoundMessage,
            this.GameFightSynchronizeMessage,
            this.GameFightTurnResumeMessage,
            this.GameFightShowFighterMessage,
            this.FighterStatsListMessage,
            this.GameActionFightMarkCellsMessage,
            this.GameActionFightSpellCastMessage,
            this.GameActionFightLifePointsLostMessage,
            this.GameActionFightLifePointsGainMessage,
            this.GameActionFightDeathMessage,
            this.GameActionFightPointsVariationMessage,
            this.GameActionFightDispellableEffectMessage,
            this.GameFightTurnReadyRequestMessage,
            this.GameFightStartMessage,
            this.GameActionFightSummonMessage,
            this.GameFightResumeMessage,
            this.GameActionFightSpellCooldownVariationMessage,
            this.GameActionFightUnmarkCellsMessage,
            this.GameActionFightInvisibilityMessage,
            this.CharacterExperienceGainMessage,
            this.SequenceEndMessage,
            this.GameActionFightExchangePositionsMessage,

            this.GameActionFightInvisibleObstacleMessage,
            this.GameRolePlayPlayerFightFriendlyRequestedMessage

        ];
    }

    FighterStatsListMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        const account = accounts[username]
        const toSend = accounts[username].plugins.Fighter.stats.toSendStats
        global.accounts[username].plugins.Fighter.stats = data.stats
        global.accounts[username].plugins.Fighter.stats.toSendStats = toSend
    }

    GameFightShowFighterMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        global.accounts[username].plugins.Fighter.fighters[data.informations.contextualId] = data.informations

        sendToBrowser("UPDATE_MAP_ACTORS", {
            username,
            fight: true,
            fightAdd: true,
            actors: [{
                id: data.informations.contextualId,
                cell: data.informations.disposition.cellId,
                type: data.informations.teamId == accounts[username].plugins.Fighter.teamId ? (data.informations.contextualId == accounts[username].extra.selectedCharacter.id ? "me" : "player") : "monster",
                name: data.informations.name || data.informations.creatureGenericId
            }]
        })
    }

    GameEntitiesDispositionMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;

        /*const meDispositionCell = data.dispositions.find(e => e.id == accounts[username].extra.selectedCharacter.id).cellId
        const me = accounts[username].plugins.Fighter.fighters[accounts[username].extra.selectedCharacter.id]
        if(!me) return;
		
        if(meDispositionCell != me.disposition.cellId){
        	sendToBrowser("UPDATE_MAP_ACTORS", {
        		username,
        		oldActor: {
        			cell: me.disposition.cellId,
        			id: me.contextualId,
        			name: me.name
        		},
        		newActor: {
        			cell: meDispositionCell,
        			id: me.contextualId,
        			name: me.name,
        			type: "me"
        		}
        	})
        }
        */

        for (const disposition of data.dispositions) {
            if (!accounts[username].plugins.Fighter.fighters[disposition.id]) continue;

            const old = accounts[username].plugins.Fighter.fighters[disposition.id].disposition.cellId
            global.accounts[username].plugins.Fighter.fighters[disposition.id].disposition = disposition;
            sendToBrowser("UPDATE_MAP_ACTORS", {
                username,
                oldActor: {
                    cell: old,
                    id: accounts[username].plugins.Fighter.fighters[disposition.id].contextualId,
                    name: accounts[username].plugins.Fighter.fighters[disposition.id].name
                },
                newActor: {
                    cell: accounts[username].plugins.Fighter.fighters[disposition.id].disposition.cellId,
                    id: accounts[username].plugins.Fighter.fighters[disposition.id].contextualId,
                    name: accounts[username].plugins.Fighter.fighters[disposition.id].name,
                    type: accounts[username].plugins.Fighter.fighters[disposition.id].teamId == accounts[username].plugins.Fighter.teamId ? (accounts[username].plugins.Fighter.fighters[disposition.id].contextualId == accounts[username].extra.selectedCharacter.id ? "me" : "player") : "monster"
                }
            })
        }

    }

    GameFightStartingMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        const account = accounts[username]
        const fighterObject = account.plugins.Fighter

        log.info(username, "Combat en cours de préparation.")
        setState(username, "FIGHTING")
        accounts[username].plugins.Fighter.fighting = true;

        global.accounts[username].plugins.Fighter.spellsToUse = {};


        if (fighterObject.config.auto) {
            plugins.Fighter.autoModeInit(username);
        } else {
            const instructions = fighterObject.config.instructions[account.extra.selectedCharacter.breed] || []
            for (const instruction of instructions) {
                const spell = fighterObject.spells.find(e => e.id == instruction.spellId);
                global.accounts[username].plugins.Fighter.spellsToUse[instruction.spellId] = {
                    currentCooldown: spell.spellLevel.initialCooldown,
                    castsThisTurn: 0,
                    error: false
                }
            }
        }

        /*if(this.resumedCooldowns){
        	for(var i in this.resumedCooldowns[username]){
        		this.spellsToUse[username][this.resumedCooldowns[username][i].spellId].spellLevel["currentCooldown"]=this.resumedCooldowns[username].cooldown
        		console.log("Cooldown", this.spellsToUse[username][this.resumedCooldowns[username][i].spellId].nameId, this.resumedCooldowns[username].cooldown, "tours")
        	}
        }*/

        sendToBrowser("CLEAR_PATH", { username })
        sendToBrowser("UPDATE_MAP_ACTORS", {
            username,
            fight: true,
            fightAdd: false,
            actors: []
        })
    }


    /**
     ** When a fight ends
     **/
    GameFightEndMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        const account = accounts[username]

        log.success(username, "Fin du combat. Temps: <span style='color:white;'>" + Math.floor(data.duration / 1000) + "</span>s")
        setState(username, "IDLE")

        global.accounts[username].plugins.Fighter = {
            config: accounts[username].plugins.Fighter.config,
            spells: accounts[username].plugins.Fighter.spells,
            fighting: false,
            fighters: {},
            spellsToUse: {
                sample: {
                    currentCooldown: 0,
                    castsThisTurn: []
                }
            },
            teamId: 0,
            ourTurn: false,
            marks: {}
        }
    }

    CharacterExperienceGainMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        log.info(username, `Vous avez gagné <span style='color:white;'>${format(data.experienceCharacter)}</span> points d'éxpérience.`)
        if (data.experienceGuild > 0) log.info(username, `Votre guilde a gagné <span style='color:white;'>${format(data.experienceGuild)}</span> points d'éxpérience.`)
        if (data.experienceMount > 0) log.info(username, `Vous monture a gagné <span style='color:white;'>${format(data.experienceMount)}</span> points d'éxpérience.`)
    }

    /**
     ** When the fight synchronizes. It helps us to know from which team we are and gives us data about the parties involved in the fight.
     **/
    GameFightSynchronizeMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        const account = accounts[username];
        var fighterObject = account.plugins.Fighter

        while (!account.extra.selectedCharacter) continue;

        global.accounts[username].plugins.Fighter.fighters = {}
        global.accounts[username].plugins.Fighter.teamId = data.fighters.find(e => e.contextualId == account.extra.selectedCharacter.id).teamId;

        var actorsToSend = []
        for (const fighter of data.fighters) {
            if (!fighter.name) fighter.name = monsters[fighter.creatureGenericId];
            global.accounts[username].plugins.Fighter.fighters[fighter.contextualId] = fighter
            if (fighter.stats.lifePoints > 0 && fighter.alive) {
                actorsToSend.push({
                    id: fighter.contextualId,
                    cell: fighter.disposition.cellId,
                    type: fighter.teamId == fighterObject.teamId ? (fighter.contextualId == account.extra.selectedCharacter.id ? "me" : "player") : "monster",
                    name: fighter.name || monsters[fighter.creatureGenericId]
                })
            }


        }

        sendToBrowser("UPDATE_MAP_ACTORS", {
            username,
            fight: true,
            actors: actorsToSend
        })
    }


    GameFightResumeMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        // this.resumedCooldowns={}
        // this.resumedCooldowns[username]=data.spellCooldowns

        log.warn(username, "Reconnexion en combat.")
        setState(username, "FIGHTING")
        accounts[username].plugins.Fighter.fighting = true;

        for (const spell of data.spellCooldowns) {
            accounts[username].plugins.Fighter.spellsToUse[spell.spellId].currentCooldown = spell.cooldown
        }

    }


    /**
     ** When we reconnect in fight, it is like a TurnStart
     **/
    async GameFightTurnResumeMessage(payload) {
        const username = payload.socket.account.username;

        accounts[username].plugins.Fighter.ourTurn = true;
        setTimeout(() => plugins.Fighter.fight(username), 2000)
            // payload.socket.eventEmitter.once("GameFightSynchronizeMessage", (payload)=>plugins.Fighter.fight(username))
    }


    /**
     ** Placement before start
     **/
    GameFightPlacementPossiblePositionsMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        const account = accounts[username];
        const fighterObject = account.plugins.Fighter

        var fightId;
        socket.eventEmitter.once("GameFightOptionStateUpdateMessage", (payload) => {
            fightId = payload.data.fightId
        })
        var currentDistance = false;
        var finalCellId = -1;
        var positions = data.teamNumber == 0 ? data.positionsForChallengers : data.positionsForDefenders;

        socket.eventEmitter.once("GameFightShowFighterMessage", (payload) => {
            setTimeout(() => {
                for (const cellId of positions) {
                    if (plugins.Fighter.getActorOnCell(username, cellId)) continue;
                    var enemy = getClosestFighterOfCell(cellId, plugins.Fighter.getAliveEnemies(username))
                    if (!enemy) continue;
                    var distance = getCellDistance(enemy.disposition.cellId, cellId);
                    if (finalCellId == -1 || (fighterObject.config.berserker ? (distance > 1 && distance < currentDistance) : (distance > currentDistance && distance < accounts[username].plugins.Fighter.config.maxDistance))) {
                        finalCellId = cellId;
                        currentDistance = distance;
                    }
                }
                if (finalCellId != -1) socket.sendMessage("GameFightPlacementPositionRequestMessage", { cellId: finalCellId });

                setTimeout(() => {
                    const party = parties.find(party => party.leader == username)
                    if (party) {
                        var readies = []
                        socket.eventEmitter.on("GameFightHumanReadyStateMessage", (payload) => {
                            if (!readies.includes(payload.data.characterId)) readies.push(payload.data.characterId)
                            if (readies.length == party.slaves.length) {
                                socket.eventEmitter.off("GameFightHumanReadyStateMessage")
                                socket.sendMessage("GameFightReadyMessage", { isReady: true });
                            }
                        })
                        for (const slave of party.slaves) {
                            accounts[slave].socket.sendMessage("GameFightJoinRequestMessage", {
                                fightId,
                                fighterId: account.extra.selectedCharacter.id
                            });
                            const id = setInterval(() => {
                                if (!accounts[slave].plugins.Fighter.fighting)
                                    accounts[slave].socket.sendMessage("GameFightJoinRequestMessage", {
                                        fightId,
                                        fighterId: account.extra.selectedCharacter.id
                                    });
                                else clearTimeout(id)
                            }, 2000)
                        }

                    } else socket.sendMessage("GameFightReadyMessage", { isReady: true });
                }, 500);
            }, 500)
        })

        sendToBrowser("UPDATE_MAP_ACTORS", {
            username,
            placements: {
                challengers: data.positionsForChallengers,
                defenders: data.positionsForDefenders
            }
        })
    }


    /**
     ** When it is someone's turn to play, including ours.
     **/
    GameFightTurnStartMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        const account = accounts[username];

        while (!account.extra.selectedCharacter) continue;

        if (account.extra.selectedCharacter.id == data.id) {
            log.info(username, "<span style='background-color:#ef476f; padding:0.5px 2px 0.5px 2px;'>Nouveau tour.</span>", true)

            global.accounts[username].plugins.Fighter.ourTurn = true;
            if (account.plugins.Fighter.config.skipTurn && !account.plugins.Fighter.config.auto) {
                return plugins.Fighter.finishMyTurn(username);
            }
            for (const i in accounts[username].plugins.Fighter.spellsToUse) {
                if (!accounts[username].plugins.Fighter.config.auto) {
                    global.accounts[username].plugins.Fighter.spellsToUse[i].error = false;
                    global.accounts[username].plugins.Fighter.spellsToUse[i].castsThisTurn = 0;
                } else {
                    global.accounts[username].plugins.Fighter.spellsToUse[i].castsThisTurn = [];
                }
                global.accounts[username].plugins.Fighter.spellsToUse[i].currentCooldown--;
            }
            payload.socket.eventEmitter.once("GameFightSynchronizeMessage", (payload) => plugins.Fighter.fight(username))
        } else {
            global.accounts[username].plugins.Fighter.ourTurn = false;
        }
    }

    /**
     **Process marks
     **/
    async GameActionFightMarkCellsMessage(payload) {
        const { socket, data } = payload

        const username = socket.account.username;
        /*for(i in data.mark.cells){
        	
        	this.marks[username].push(data.mark.cells[i].cellId)
        }*/
        global.accounts[username].plugins.Fighter.marks[data.mark.markId] = data.mark
    }

    GameActionFightInvisibleObstacleMessage(payload) {
        const { socket, data } = payload;
        const username = socket.account.username;
        console.log("INVISIBLE")
        console.log(data)
    }


    async GameActionFightSpellCastMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;

        if (data.sourceId == accounts[username].extra.selectedCharacter.id) socket.eventEmitter.emit("PlayerCast")
        log.info(username, `${accounts[username].plugins.Fighter.fighters[data.sourceId].name || data.sourceId} lance <span style='color:white;'>${spells[data.spellId].name}</span>`, true)
            // socket.eventEmitter.once("GameActionFightPointsVariationMessage", (payload)=>plugins.Fighter.fight(username))
        socket.eventEmitter.once("SequenceEndMessage", (payload) => plugins.Fighter.fight(username))

    }

    async GameActionFightNoSpellCastMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;

        const spell = accounts[username].plugins.Fighter.spells.find(e => e.spellLevel.id == data.spellLevelId);
        if (!accounts[username].plugins.Fighter.config.auto) {
            global.accounts[username].plugins.Fighter.spellsToUse[spell.id].error = true;
        }
        log.error(username, `Le sort: <span style='color:white;'>${spell.name}</span> n'a pas pu être lancé.`)

        // plugins.Fighter.fight(username);
        // socket.eventEmitter.once("SequenceEndMessage", (payload)=>plugins.Fighter.fight(username))

        plugins.Fighter.finishMyTurn(username);


    }

    async GameActionFightLifePointsLostMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;

        accounts[username].plugins.Fighter.fighters[data.targetId].stats.lifePoints -= data.loss

        var mort = ""
        if (accounts[username].plugins.Fighter.fighters[data.targetId].stats.lifePoints <= 0) mort = "(Mort)"
        log.info(username, `${accounts[username].plugins.Fighter.fighters[data.targetId].name || data.targetId}: <span class='error'>-${data.loss}</span>PDV ${mort}.`, true)

        if (data.targetId == accounts[username].extra.selectedCharacter.id) {
            accounts[username].plugins.Fighter.stats.lifePoints -= data.loss
            sendToBrowser("HEALTH_UPDATE", {
                username,
                lifePoints: accounts[username].plugins.Fighter.stats.lifePoints,
                maxLifePoints: accounts[username].plugins.Fighter.stats.maxLifePoints
            })
        }


    }

    async GameActionFightLifePointsGainMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;

        log.info(username, `${accounts[username].plugins.Fighter.fighters[data.targetId].name || data.targetId}: <span class='success'>+${data.delta}</span>PDV.`, true)

        accounts[username].plugins.Fighter.fighters[data.targetId].stats.lifePoints += data.delta

        if (data.targetId == accounts[username].extra.selectedCharacter.id) {
            accounts[username].plugins.Fighter.stats.lifePoints += data.delta
            sendToBrowser("HEALTH_UPDATE", {
                username,
                lifePoints: accounts[username].plugins.Fighter.stats.lifePoints,
                maxLifePoints: accounts[username].plugins.Fighter.stats.maxLifePoints
            })
        }
    }
    async GameActionFightDeathMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        // accounts[username].plugins.Fighter.fighters[data.targetId].alive = false
        sendToBrowser("UPDATE_MAP_ACTORS", {
            username,
            oldActor: {
                cell: accounts[username].plugins.Fighter.fighters[data.targetId].disposition.cellId,
                id: accounts[username].plugins.Fighter.fighters[data.targetId].contextualId,
                name: accounts[username].plugins.Fighter.fighters[data.targetId].name
            },
            newActor: null
        })
        delete global.accounts[username].plugins.Fighter.fighters[data.targetId]

    }

    GameActionFightPointsVariationMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        const account = accounts[username];
        if (data.targetId == account.extra.selectedCharacter.id) {
            if ([129, 127].includes(data.actionId)) account.plugins.Fighter.stats.movementPointsCurrent += data.delta //129: normal, 127: tacle
            else if ([102, 101].includes(data.actionId)) account.plugins.Fighter.stats.actionPointsCurrent += data.delta //102: normal, 101: tacle
        }

        var action;
        var color;
        var delta;

        if ([129, 127].includes(data.actionId)) {
            account.plugins.Fighter.fighters[data.targetId].stats.movementPoints += data.delta //129: normal, 127: tacle
            action = "PM"
            color = "green"
        } else if ([102, 101].includes(data.actionId)) {
            account.plugins.Fighter.fighters[data.targetId].stats.actionPoints += data.delta //102: normal, 101: tacle
            action = "PA"
            color = "#007FFF" //"blue"
        }



        if (data.delta < 0) {
            color = "red"
            delta = data.delta
        } else {
            // color = "green"
            delta = "+" + data.delta
        }

        if ([127, 101].includes(data.actionId) || data.delta > 0) log.info(username, `${account.plugins.Fighter.fighters[data.targetId].name || data.targetId}: <span style='color: ${color};'>${delta}</span>${action}.`, true)
    }

    GameActionFightDispellableEffectMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        const account = accounts[username];
        if (data.effect.targetId == account.extra.selectedCharacter.id) {
            if ([128].includes(data.actionId)) account.plugins.Fighter.stats.movementPointsCurrent += data.effect.delta //128: pm
            else if ([111].includes(data.actionId)) account.plugins.Fighter.stats.actionPointsCurrent += data.effect.delta //111: pa
        }

        var action;
        var color;
        var delta;

        if ([128].includes(data.actionId)) {
            account.plugins.Fighter.fighters[data.effect.targetId].stats.movementPoints += data.effect.delta //129: normal, 127: tacle
            action = "PM"
            color = "green"
        } else if ([111].includes(data.actionId)) {
            account.plugins.Fighter.fighters[data.effect.targetId].stats.actionPoints += data.effect.delta //102: normal, 101: tacle
            action = "PA"
            color = "#007FFF" //"blue"
        }



        if (data.effect.delta < 0) {
            color = "red"
            delta = data.effect.delta
        } else {
            // color = "green"
            delta = "+" + data.effect.delta
        }

        if ([128, 111].includes(data.actionId)) log.info(username, `${account.plugins.Fighter.fighters[data.effect.targetId].name || data.effect.targetId}: <span style='color: ${color};'>${delta}</span>${action} (${data.effect.turnDuration} Tours).`, true)
    }


    GameFightTurnReadyRequestMessage(payload) {
        const { socket, data } = payload

        socket.sendMessage("GameFightTurnReadyMessage", { isReady: true })
    }


    GameFightStartMessage(payload) {
        const username = payload.socket.account.username;
        const account = accounts[username];
        log.success(username, "Combat commencé.")

        var allies = "";
        var enemies = "";

        for (const i in account.plugins.Fighter.fighters) {
            const fighter = account.plugins.Fighter.fighters[i]
            fighter.teamId == account.plugins.Fighter.teamId ? allies += `, ${fighter.name || fighter.creatureGenericId}` : enemies += `, ${fighter.name || monsters[fighter.creatureGenericId]}`
        }

        log.info(username, `Alliés: <span style='color:white;'>${allies.slice(2)}.</span>`)
        log.error(username, `Enemies: <span style='color:white;'>${enemies.slice(2)}.</span>`)

        /*log.info(username, `PA: <span style='color:white;'>${account.plugins.Fighter.stats.actionPointsCurrent}.</span>`)
        log.info(username, `PM: <span style='color:white;'>${account.plugins.Fighter.stats.movementPointsCurrent}.</span>`)
		
        log.info(username, `Starting cell: <span style='color:white;'>${account.plugins.Fighter.fighters[account.extra.selectedCharacter.id].disposition.cellId}.</span>`)*/

        sendToBrowser("UPDATE_MAP_ACTORS", {
            username,
            placements: {
                challengers: [],
                defenders: []
            }
        })
    }

    GameActionFightSummonMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;

        if (!data.summon.name) data.summon.name = monsters[data.summon.creatureGenericId];
        global.accounts[username].plugins.Fighter.fighters[data.summon.contextualId] = data.summon

        const fighter = accounts[username].plugins.Fighter.fighters[data.summon.contextualId];
        sendToBrowser("UPDATE_MAP_ACTORS", {
            username,
            fight: true,
            fightAdd: true,
            actors: [{
                id: data.summon.contextualId,
                cell: data.summon.disposition.cellId,
                type: data.summon.teamId == accounts[username].plugins.Fighter.teamId ? (data.summon.contextualId == accounts[username].extra.selectedCharacter.id ? "me" : "player") : "monster",
                name: data.summon.name || data.summon.creatureGenericId
            }]
        })
    }

    GameActionFightExchangePositionsMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;

        const fighters = accounts[username].plugins.Fighter.fighters;

        for (const id in fighters) {
            if (fighters[id].disposition.cellId == data.casterCellId) {
                accounts[username].plugins.Fighter.fighters[id].disposition.cellId = data.targetCellId;
                sendToBrowser("UPDATE_MAP_ACTORS", {
                    username,
                    oldActor: {
                        cell: data.casterCellId,
                        id,
                        name: fighters[id].name
                    },
                    oldActor: {
                        cell: data.targetCellId,
                        id,
                        name: fighters[id].name
                    }
                })
            }
            if (fighters[id].disposition.cellId == data.targetCellId) {
                accounts[username].plugins.Fighter.fighters[id].disposition.cellId = data.casterCellId;
                sendToBrowser("UPDATE_MAP_ACTORS", {
                    username,
                    oldActor: {
                        cell: data.casterCellId,
                        id,
                        name: fighters[id].name
                    },
                    oldActor: {
                        cell: data.targetCellId,
                        id,
                        name: fighters[id].name
                    }
                })
            }
        }

    }

    GameActionFightSpellCooldownVariationMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        const account = accounts[username];
        if (data.targetId == account.extra.selectedCharacter.id) global.account.plugins.Fighter.spellsToUse[data.spellId].currentCooldown = data.value
    }

    GameActionFightInvisibilityMessage(payload) {
        const { socket, data } = payload
        const username = socket.account.username;
        global.accounts[username].plugins.Fighter.fighters[data.targetId].stats.invisibilityState = data.state
    }

    GameActionFightUnmarkCellsMessage(payload) {
        const { socket, data } = payload

        console.log(data)
    }

    SequenceEndMessage(payload) {
        const { socket, data } = payload

        socket.sendMessage("GameActionAcknowledgementMessage", {
            actionId: data.actionId,
            valid: true
        });
    }


    GameRolePlayPlayerFightFriendlyRequestedMessage(payload) {
        const { socket, data } = payload;
        // fightId: 994
        // sourceId: 5349019
        // targetId: 6899804

        if (data.sourceId == 5349019) socket.sendMessage("GameRolePlayPlayerFightFriendlyAnswerMessage", {
            fightId: data.fightId,
            accept: true
        })
        socket.sendMessage("LeaveDialogRequestMessage");
    }
}