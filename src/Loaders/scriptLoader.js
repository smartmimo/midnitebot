const header = require("fs").readFileSync(require("path").join(__dirname, 'scriptHeader.js'), "utf8");

const delay = 1000;

module.exports = class ScriptLoader {
    constructor(username, name, textCode, ws) {
        this.username = username;
        this.name = name;
        this.textCode = textCode;

        this.forceStop = false;
        this.generator = null;
        this.customGenerator = null;

        this.timeout = null;

        this.registered = {};

        if (
            textCode.toLowerCase().includes("require('fs')") ||
            textCode.toLowerCase().includes('require("fs")') ||
            textCode.toLowerCase().includes('require(`fs`)') ||
            textCode.toLowerCase().includes('require("fs-extra")') ||
            textCode.toLowerCase().includes("require('fs-extra')") ||
            textCode.toLowerCase().includes("require(`fs-extra`)") ||
            textCode.toLowerCase().includes('readfile') ||
            textCode.toLowerCase().includes('readdir')
        ) throw new Error("L'usage de fs n'est pas autorisé, si vous voulez lire des fichiers utilisez des requêtes.")
        try {

            if (name == "live") {
                textCode = header + "\n" + textCode
            } else {
                textCode += header;
                textCode += `
					if(typeof start !== 'undefined') this.start = start;
					if(typeof stop !== 'undefined') this.stop = stop;
					if(typeof move !== 'undefined') this.move = move;
					if(typeof bank !== 'undefined') this.bank = bank;
					if(typeof phoenix !== 'undefined') this.phoenix = phoenix;

					if(!this.move) log.warn("Votre script ne contient pas une fonction move, il ne pourra pas fonctionner.")
					if(!this.bank) log.warn("Votre script ne contient pas une fonction bank, le bot restera bloqué s'il est en full pod.")
					if(!this.phoenix) log.warn("Votre script ne contient pas une fonction phoenix, le bot restera bloqué s'il a 0 énergie.")
				`;
            }
            eval(textCode);

        } catch (error) {
            throw error;
        }

    }


    async run() {
        const isSlave = parties.find(party => party.slaves.includes(this.username))
        try {
            accounts[this.username].script.forceStop = false;
            accounts[this.username].script["running"] = true;

            sendToBrowser("LOG", {
                username: this.username,
                html: `<p class = 'success'>Le script <span style='color:white;'>${accounts[this.username].script.name}</span> est lancé.</p>`
            })
            sendToBrowser("SCRIPT_START", {
                username: this.username
            })

            if (this.start) {

                sendToBrowser("LOG", {
                    username: this.username,
                    html: "<p class='info'>Détection d'une fonction start, exécution de cette dernière.</p>"
                })

                if (this.isGeneratorFunction(this.start)) {
                    this.generator = this.start();
                    let s = 1;
                    let nextValue;
                    while (true) {
                        const next = this.generator.next(nextValue);
                        this.next = next;
                        nextValue = await next.value;
                        accounts[this.username].socket.eventEmitter.off("stopScript")
                        if (next.done === true) {
                            break;
                        }
                        s++;
                    }
                } else await this.start();

                sendToBrowser("LOG", {
                    username: this.username,
                    html: "<p class='info'>Fin de la fonction start.</p>"
                })
            }

            if (!accounts[this.username].script["running"]) return;



            /*BEING MOVE*/
            if (!this.move) throw new Error("Le script ne contient pas une fonction move().")
            if (!this.isGeneratorFunction(this.move)) throw new Error("La fonction move() doit être une fonction génératetrice: function* move(){}")
            accounts[this.username].socket.eventEmitter.on("nextMapReady", async() => {
                await new Promise(r => setTimeout(r, delay))

                /*sendToBrowser("LOG", {
                	username: this.username,
                	html: "<p class='warn'>NextMapReady</p>"
                })*/

                try {
                    const account = accounts[this.username];
                    const config = configs[this.username];
                    const accountPlugins = account.plugins;
                    const socket = account.socket;

                    var name = "move";
                    const { weight, maxWeight } = account.inventory.weight;
                    if (accountPlugins.Fighter.stats.energyPoints == 0) {
                        if (account.state == "BURIED ALIVE") {
                            socket.sendMessage("GameRolePlayFreeSoulRequestMessage")
                            socket.sendMessage("LeaveDialogRequestMessage")
                            setState(this.username, "IDLE")
                        }
                        if (!this.phoenix) throw new Error("Le script ne contient pas une fonction phoenix().")
                        if (!this.isGeneratorFunction(this.phoenix)) throw new Error("La fonction phoenix() doit être une fonction génératetrice: function* phoenix(){}")
                        this.generator = this.phoenix()
                        name = "phoenix"
                    } else if ((weight / maxWeight) * 100 >= config.bank) {
                        if (!this.bank) throw new Error("Le script ne contient pas une fonction bank().")
                        if (!this.isGeneratorFunction(this.bank)) throw new Error("La fonction bank() doit être une fonction génératetrice: function* bank(){}")
                        this.generator = this.bank()
                        name = "bank"
                    } else this.generator = this.move();

                    let s = 1;
                    let nextValue;
                    while (true) {
                        const next = this.generator.next(nextValue);
                        this.next = next;
                        nextValue = await next.value;
                        accounts[this.username].socket.eventEmitter.off("stopScript")
                        if (next.done === true) {
                            break;
                        }
                        s++;
                    }

                    if (Array.isArray(nextValue)) {
                        for (const instruction of nextValue) {
                            const map = instruction.map.toString().trim().replace(/\s/g, "").replace(/\r\n/g, "\r").replace(/\n/g, "\r")
                            if (instruction.map.toString() == accountPlugins.Map.id.toString() || map == `${accountPlugins.Map.pos.x},${accountPlugins.Map.pos.y}`) {
                                if (name != "phoenix") {
                                    if (this.autoDelete.length > 0) {
                                        for (const id of this.autoDelete) {
                                            const items = account.inventory.items.filter(e => e.GID == id)
                                            if (items.length > 0) {
                                                for (const item of items)
                                                    socket.sendMessage("ObjectDeleteMessage", {
                                                        objectUID: item.UID,
                                                        quantity: item.quantity
                                                    })
                                            }
                                        }
                                    }

                                    if (instruction.phoenix == true || instruction.phoenix == "true") {

                                        await plugins.Map.useInteractiveElement(this.username, 463535)
                                    }
                                    if (!accounts[this.username].script["running"]) return;

                                    if (name == "bank" && instruction.bank) {
                                        const talked = await plugins.Npc.npcBank(this.username);
                                        if (talked) {
                                            await plugins.Exchange.giveAllObjects(this.username, this.bankWhitelist);
                                            await plugins.Exchange.cancelExchange(this.username);
                                        }
                                        if (!accounts[this.username].script["running"]) return;
                                        return accounts[this.username].socket.eventEmitter.emit("nextMapReady")
                                    }

                                    if (!accounts[this.username].script["running"]) return;

                                    if (instruction.gather) {
                                        var gathered = await plugins.Map.gather(this.username, this.forbiddenGathers, this.forcedGathers);
                                        while (gathered) {
                                            if (!accounts[this.username].script["running"]) return;
                                            gathered = await plugins.Map.gather(this.username, this.forbiddenGathers, this.forcedGathers);
                                        }

                                        sendToBrowser("LOG", {
                                            username: this.username,
                                            html: `<p class = 'warn'>[${accountPlugins.Map.pos.x},${accountPlugins.Map.pos.y}]: Aucune récolte n'est disponible sur la map.</p>`
                                        })
                                    }

                                    if (!accounts[this.username].script["running"]) return;

                                    if (instruction.fight == true || instruction.fight == 'true') {
                                        if (!isSlave) {
                                            var startedFight = await plugins.Map.fight(this.username, this.minMonsters, this.maxMonsters, this.forbiddenMonsters, this.forcedMonsters, this.regenerateItems);
                                            while (startedFight) {
                                                await new Promise(r => setTimeout(r, 2000))

                                                if (accountPlugins.Fighter.fighting) return;
                                                startedFight = await plugins.Map.fight(this.username, this.minMonsters, this.maxMonsters, this.forbiddenMonsters, this.forcedMonsters, this.regenerateItems);
                                            }
                                        } else {
                                            accounts[isSlave.leader].socket.eventEmitter.emit("plsFightFunctionState")
                                            const isFighting = await new Promise(r => socket.eventEmitter.once('fightFunctionOver', r));
                                            if (isFighting) return;
                                        }

                                    }

                                    if (!accounts[this.username].script["running"]) return;
                                }



                                if (instruction.interactive || instruction.door) await plugins.Map.useInteractiveByCell(this.username, instruction.interactive || instruction.door)

                                if (!accounts[this.username].script["running"] ||
                                    !(
                                        instruction.map.toString() == accounts[this.username].plugins.Map.id.toString() ||
                                        map == `${accounts[this.username].plugins.Map.pos.x},${accounts[this.username].plugins.Map.pos.y}`
                                    )
                                ) return;


                                if (instruction.custom) {
                                    //I wanted to code this while I was drunk in Essaouira but I was too busy having fun and falling asleep later, so I'm instead I'm coding it while hungover the next day.
                                    const args = instruction.args || []
                                    if (!this.isGeneratorFunction(instruction.custom)) await instruction.custom(args)
                                    else {
                                        this.customGenerator = instruction.custom(args);
                                        let s = 1;
                                        let nextValue;
                                        while (true) {
                                            const next = this.customGenerator.next(nextValue);
                                            this.next = next;
                                            nextValue = await next.value;
                                            accounts[this.username].socket.eventEmitter.off("stopScript")
                                            if (next.done === true) {
                                                break;
                                            }
                                            s++;
                                        }
                                    }
                                }
                                await new Promise(r => setTimeout(r, 1000))
                                if (!accounts[this.username].script["running"] ||
                                    !(
                                        instruction.map.toString() == accounts[this.username].plugins.Map.id.toString() ||
                                        map == `${accounts[this.username].plugins.Map.pos.x},${accounts[this.username].plugins.Map.pos.y}`
                                    )
                                ) return;

                                if (instruction.path) {
                                    var path = instruction.path
                                    if (instruction.path.includes("|")) {
                                        const items = path.split("|")
                                        path = items[Math.floor(Math.random() * items.length)]
                                    }
                                    const changedMap = await plugins.Map.ChangeMapMessage(this.username, path)
                                    if (changedMap) return;
                                }

                                await new Promise(r => setTimeout(r, 2000))

                                if (!accounts[this.username].script["running"] ||
                                    !(
                                        instruction.map.toString() == accounts[this.username].plugins.Map.id.toString() ||
                                        map == `${accounts[this.username].plugins.Map.pos.x},${accounts[this.username].plugins.Map.pos.y}`
                                    )
                                ) return;

                                return accounts[this.username].socket.eventEmitter.emit("nextMapReady")
                            }
                        }
                    } else {
                        sendToBrowser("LOG", {
                            username: this.username,
                            html: `<p class = 'error'>La valeur retournée dans ${name}() est invalide: <pre class='error'>${typeof nextValue == 'object' ? JSON.stringify(nextValue, null, 4) : nextValue}</pre></p>`
                        })
                    }
                    sendToBrowser("LOG", {
                        username: this.username,
                        html: `<p class = 'error'>[${accountPlugins.Map.pos.x},${accountPlugins.Map.pos.y}]: Aucune action à effectuer.</p>`
                    })
                    this.stopScript()

                } catch (e) {
                    sendToBrowser("LOG", {
                        username: this.username,
                        html: `<p class = 'error'>Le script <span style='color:white;'>${this.name}</span> à rencontré une erreur: <pre class = 'error'>${e}</pre></p>`
                    })

                    console.log(e)

                    this.forceStop = true;
                    this.stopScript()

                    // throw e;
                }
            })
            accounts[this.username].socket.eventEmitter.emit("nextMapReady")

        } catch (e) {
            sendToBrowser("LOG", {
                username: this.username,
                html: `<p class = 'error'>Le script <span style='color:white;'>${this.name}</span> à rencontré une erreur: <pre class = 'error'>${e.message}</pre></p>`
            })

            this.forceStop = true;
            this.stopScript()

            console.log(e)
            throw e;
        }
    }

    async stopScript() {
        if (this.stop) await this.stop(this.forceStop);

        accounts[this.username].script["running"] = false;
        // this.generator.return();
        accounts[this.username].socket.eventEmitter.off("nextMapReady")
        accounts[this.username].socket.eventEmitter.emit("stopScript")

        for (const msg in this.registered) {
            accounts[this.username].socket.eventEmitter.off(msg, this.registered[msg].cb)
        }

        this.registered = {};

        sendToBrowser("LOG", {
            username: this.username,
            html: `<p class = 'success'>Le script <span style='color:white;'>${this.name}</span> est terminé. ${this.forceStop ? "(Forcé)" : ""}</p>`
        })
        sendToBrowser("SCRIPT_LOADED", {
            username: this.username,
            name: this.name
        })
    }

    forceStopScript() {
        this.forceStop = true;
        if (this.generator) this.generator.return();
        if (this.customGenerator) this.customGenerator.return();

        this.stopScript();
        // sendToBrowser("LOG", { username: this.username, html: "<p class='error'>I can't figure out how to force stop (y)</p>"});
    }



    isGeneratorFunction(fn) {
        /*console.log("check")
        try {
        	const name = fn.toString();
        	const constructorName = fn.constructor.name;
        	if (
        		name == "[object Generator]" ||
        		name == "[object AsyncGenerator]" ||
        		constructorName == "_Generator" ||
        		constructorName == "_AsyncGenerator"
        	) {
        		return true;
        	}
        } catch (error) {}

        return false;*/

        return fn.constructor.name === 'GeneratorFunction' || fn.constructor.name === 'AsyncGeneratorFunction';
    }

}