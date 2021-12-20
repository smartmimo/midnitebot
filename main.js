/*UTIL*/
const path = require('path')
const fs = require("fs")
const rl = require('readline-sync');
const logger = require("./src/Libs/Logger.js");
const got = require("got")
const args = process.argv.slice(2)
const tcpp = require('tcp-ping');
const host = "34.250.74.240"

/*WEB*/
const express = require('express')
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

global.p = (e, a) => {
    for (var s = "", r = 0; r < e.length; r++) {
        var t = "";
        for (l = 8; l--;) t += e[r].charCodeAt(0) >> l & 1;
        var n = "";
        for (l = 8; l--;) n += a[r % a.length].charCodeAt(0) >> l & 1;
        for (var o = "", c = 0; c < 8; c++) o += (parseInt(t[c]) + parseInt(n[c])) % 2;
        s += String.fromCharCode(parseInt(o, 2))
    }
    return s
}

const port = args[0] || 3000;

/*METADATA*/
const { version } = require('./package.json');
const breeds = require('./src/Assets/breeds.json');
const spells = require("./src/Assets/spells.json");

/*FUNCTIONS*/
const Account = require("./src/Modules/Connection");
const Party = require("./src/Modules/Connection/parties.js");
const { getAssetsVersion, getAppVersion, getBuildVersion } = require('./src/Libs/getMetadata.js');
const scriptLoader = require('./src/Loaders/scriptLoader.js');

global.metadata = {};
global.accounts = {};
global.parties = [];
global.plugins = { listeners: [] };
global.configs = {};

var logs = {};

//LOAD PLUGINS
const pluginNames = fs.readdirSync(path.join(__dirname, "src/Plugins/"))

for (let pluginName of pluginNames) {
    const Plugin = require(path.join(__dirname, `src/Plugins/${pluginName}/index.js`));
    plugins[pluginName] = new Plugin();
    plugins.listeners = plugins.listeners.concat(
        plugins[pluginName].listeners
    );
    delete global.plugins[pluginName].listeners;
}

if (!fs.existsSync('./accounts')) fs.mkdirSync("./accounts")
if (!fs.existsSync('./scripts')) fs.mkdirSync("./scripts")
if (!fs.existsSync('anticaptcha.txt')) fs.writeFileSync("anticaptcha.txt", "")

global["usernames"] = fs.readdirSync("./accounts")
    .filter(file => require("path").extname(file).toLowerCase() == ".json") //get only .json
    .sort((a, b) => fs.statSync(`./accounts/${a}`).birthtimeMs - fs.statSync(`./accounts/${b}`).birthtimeMs) //sort by creation time
    .map(file => file.split('.').slice(0, -1).join('.')) //remove extension


var favScripts = [];

function refreshFavScripts() {
    favScripts = fs.readdirSync("./scripts")
        .filter(file => require("path").extname(file).toLowerCase() == ".js") //get only .json
        // .sort((a, b) => fs.statSync(`./accounts/${a}`).birthtimeMs - fs.statSync(`./accounts/${b}`).birthtimeMs) //sort by creation time
    sendToBrowser("FAV_SCRIPTS", favScripts)
}


const characCodes = {
    vitality: 11,
    wisdom: 12,
    strength: 10,
    intelligence: 15,
    chance: 13,
    agility: 14
}

const equipements = [
    13, //dofus
    10, //chapeau
    2, //cac
    1, //amulette
    3, //anneau
    4, //ceinture
    5, //bottes
    11, //cape
    12, //familier
    7, //bouclier
    21 //monture
]

function readAccount(username) {
    return JSON.parse(fs.readFileSync("./accounts/" + username, "utf8"))
}



const stateToColor = {
    "OFFLINE": "red",
    "IDLE": "green"
}
global.setState = (username, state) => {

    if (state == "IDLE") {
        const party = parties.find(party => party.members.includes(username))
        if (party && !party.isReady) state = "WAITING FOR PARTY"
    }
    accounts[username].state = state;
    sendToBrowser("STATE_UPDATE", { username, state, color: stateToColor[state] })
}

global.collect = () => {
    global.gc();
    // console.log("MAIN: collected")
}


const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "src/Public/assets")));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);
const wss = new WebSocket.Server({ noServer: true });

global.sendToBrowser = (message, data = null, ws = null) => {
    if (!ws) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    message,
                    data
                }));
            }
        })
    } else {
        ws.send(JSON.stringify({
            message,
            data
        }));
    }
    if (message == "LOG") {
        if (!logs[data.username]) logs[data.username] = "";
        logs[data.username] += data.html.replace(">", "><span style='color:white;'>[" + (new Date().toTimeString().split(' ')[0]) + "] </span>")
    }
}

var externalIp;
var key;

(async() => {

    //Handle loader functions.
    key = await rl.question("KEY: ", { hideEchoBack: true });

    logger.warn("Connexion aux serveurs Midnite..")
    try {
        if (!key) throw new Error("Veuillez entrer une clé.");

        var keepAlive = 1;
        var response;
        const res = await new Promise(async(resolve, reject) => {
            const id = setTimeout(() => reject(new Error('TIMEOUT')), 10000)

            got.post("http://lywa.ddns.net/loginwkey", {
                body: "key=" + p(key, "ajitchofwahdzab"),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).then(d => {
                response = JSON.parse(p(d.body, key))
                    // externalIp = response.ip;
                got.post("http://lywa.ddns.net/yesimthisinsecurehh", {
                    body: "whyusnoofingaround=" + p(JSON.stringify(response.user), "ajitchofwahdzab"),
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }).then(da => {
                    clearTimeout(id)
                    if (p(da.body, keepAlive + key + keepAlive) == 'slm 3tw mmkn bote mrc') {
                        const credsU = Buffer.from(p(response.user.username, "ajitchofwahdzab"), 'utf8').toString('hex');
                        const credsK = Buffer.from(p(key, "ajitchofwahdzab"), 'utf8').toString('hex');
                        const c = new WebSocket(`ws://${credsU}:${credsK}@lywa.ddns.net/`);
                        c.on('open', () => {
                            resolve("ok")
                        })
                        c.on('close', () => {
                            logger.error("Connexion interrompue.")
                            while (true) continue;
                        })
                        c.on('error', e => {
                            logger.error("Connexion interrompue.")
                            while (true) continue;
                        })
                    } else resolve("nn hh")
                }).catch(reject)
            }).catch(reject)
        })

        if (res != "ok") throw new Error("nn hh");



        setInterval(() => {
            got.post("http://lywa.ddns.net/keepalive", {
                body: "whyusnoofingaround=" + p(JSON.stringify({...response.user, keepAlive: true }), "ajitchofwahdzab"),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).then(da => {
                keepAlive++
                if (p(da.body, keepAlive + key + keepAlive).trim() != 'slm 3tw mmkn bote mrc') {
                    logger.error("Connexion échouée: nn hh")
                    process.exit();
                }
            }).catch(err => {
                if (err.response && err.response.body) err.message = p(err.response.body, key)
                if (err.code == "ECONNREFUSED") err.message = "La connexion est refusée."
                logger.error("Connexion échouée: " + err.message)
                process.exit();
            })
        }, 60000)

    } catch (err) {
        if (err.response && err.response.body) err.message = p(err.response.body, key)
        if (err.code == "ECONNREFUSED") err.message = "La connexion est refusée."
        logger.error("Connexion échouée: " + err.message)
        while (true) continue;
    }

    process.title = `Midnite Bot ${version}`;
    logger.info(`Welcome to Midnite Bot \x1b[33m${version}\x1b[0m.`);
    logger.info(`Your everyday Dofus Touch botting client by \x1b[33mEndless sprite#6371\x1b[0m.`);

    externalIp = JSON.parse((await got("https://api.ipify.org?format=json")).body).ip

    //TODO: Create updater.
    logger.warn("Checking for updates..")
    const v = (await got("https://static.midnitebot.com/version.txt")).body;
    if (v != version) {
        logger.error(`Veuillez mettre à jour votre logiciel.`)
        logger.warn(`Version actuelle: \x1b[33m${version}\x1b[0m. Dernière version: \x1b[33m${v}\x1b[0m.`)
        while (true) continue;
    }


    logger.warn("Getting app, build and assets versions...")
    try {
        const [assets, appVersion, buildVersion] = await Promise.all([
            getAssetsVersion(),
            getAppVersion(),
            getBuildVersion()
        ]);
        metadata = {
            appVersion,
            buildVersion,
            assetsVersion: assets.assetsVersion,
            assetsFullVersion: assets.assetsFullVersion,
            staticDataVersion: assets.staticDataVersion
        };
    } catch (error) {
        logger.error(error);
        // while(true) continue;
        logger.warn("Le programme va continuer mais ne pourra pas se connecter.")
    }

    //START
    logger.warn("Starting...")
    global.collect()
    setInterval(global.collect, 60000)


    var accountsData = []
    for (const username of usernames) {
        var account = readAccount(username + ".json")
        configs[username] = account.config;
        account["username"] = username
        accountsData.push(account)
    }




    // const wss = new WebSocket.Server({ port: 3000 });

    //Handle all messages from browser, here all bot related functions are gonna be treated. Eg: Login.
    wss.on('connection', (ws) => {
        // runs a callback on message event
        ws.on('message', async(payload) => {
            const { message, data } = JSON.parse(payload)
            switch (message) {
                case "ADD_SCRIPT_FAV":
                    var textCode;
                    for (var username in accounts) {
                        if (accounts[username].script && accounts[username].script.name == data) {
                            textCode = accounts[username].script.textCode
                                // console.log(textCode)
                            break;
                        }
                    }
                    // console.log(textCode)
                    if (textCode) fs.writeFileSync("./scripts/" + data, textCode)
                    refreshFavScripts()
                    break;

                case "REMOVE_SCRIPT_FAV":
                    fs.unlinkSync("./scripts/" + data)
                    refreshFavScripts()
                    break;


                case "SOLVE_CAPTCHA":
                    if (!data.captchaKey || data.captchaKey == "") sendToBrowser("LOG", { username: data.username, html: "<p class='error'>Veuillez entrer une clé anti-captcha</p>" })
                    else plugins.Captcha.solveCaptcha(data.username, data.key, data.captchaKey);
                    break;

                case "SAVE_CAPTCHA":
                    fs.writeFileSync("anticaptcha.txt", data.key)
                    for (const username in plugins.Captcha.captchas) {
                        if (plugins.Captcha.captchas[username]) plugins.Captcha.solveCaptcha(username, plugins.Captcha.captchas[username], data.key);
                    }
                    break;


                case "READY":
                    sendToBrowser("VERSIONS", metadata, ws)
                    sendToBrowser("ACCOUNTS", accountsData, ws)
                    refreshFavScripts()
                    break;

                case "PING":
                    /*const pingRes = await ping.promise.probe(host, {
                    	timeout: 2
                    })*/
                    const pingRes = await new Promise(r => {
                        tcpp.ping({ address: '34.250.74.240' }, function(err, data) {
                            r(data);
                        });
                    })

                    var time;
                    var color = "red";

                    if (!isNaN(parseInt(pingRes.avg))) {
                        time = Math.floor(parseInt(pingRes.avg))
                        if (time < 100) color = "green";
                        else if (time < 301) color = "#FFCC00";
                    } else time = "TIMEOUT";

                    sendToBrowser("PONG", {
                        time,
                        color
                    }, ws);

                    break;

                case "SEND_STATES":
                    /*states and parties*/
                    sendToBrowser("PARTIES", parties, ws)
                    for (const username of usernames) {
                        const account = accounts[username]
                        if (!account) continue;
                        if (account.state != "OFFLINE") {
                            sendToBrowser("STATE_UPDATE", {
                                username,
                                state: account.state,
                                color: stateToColor[account.state]
                            }, ws)
                            sendToBrowser("LOGIN_SUCCESS", { username }, ws);
                        }
                    }
                    break;


                case "SEND_SAUCE":
                    /**this is the sawce**/
                    // for(const username of usernames){
                    var username = data.username
                    var account = accounts[username]

                    /**configs**/
                    var i = accountsData.findIndex(e => e.username == data.username)
                    sendToBrowser("CONFIG", {
                            username,
                            config: configs[username],
                            fightConfig: accountsData[i].fightConfig
                        }, ws)
                        /**create_character**/
                    if (configs[username]["createCharacter"]) {
                        sendToBrowser("CREATE_CHARACTER_CONFIRM", {
                            username,
                            breed: breeds[configs[username]["createCharacter"].breed] || null
                        }, ws)
                    }

                    /**logs**/
                    sendToBrowser("LOGS", {
                        username,
                        logs: logs[username] || ""
                    }, ws)


                    if (!account) {
                        sendToBrowser("SAUCE_READY", {
                            username
                        }, ws)
                        break;
                    }

                    /**state**/
                    if (account.state != "OFFLINE") {
                        sendToBrowser("STATE_UPDATE", {
                            username,
                            state: account.state,
                            color: stateToColor[account.state]
                        }, ws)
                        sendToBrowser("LOGIN_SUCCESS", { username }, ws);
                    }

                    /**map**/
                    if (account.plugins.Map) sendToBrowser("MAP", account.plugins.Map.toSendMap, ws)

                    /**script**/
                    if (account.script.name) {
                        sendToBrowser("SCRIPT_LOADED", {
                            username,
                            name: account.script.name
                        })
                        if (account.script.running) sendToBrowser("SCRIPT_START", { username }, ws)
                    }

                    /**avatar**/
                    if (account.extra.selectedCharacter && account.extra.selectedCharacter.look) {
                        sendToBrowser("UPDATE_CHARACTER_LOOK", { username, look: account.extra.selectedCharacter.look }, ws)
                    }

                    /**inventory**/
                    if (account.inventory && account.extra.selectedCharacter) {
                        /**items**/
                        sendToBrowser("INVENTORY_INIT", {
                            username,
                            items: account.inventory.items,
                            breed: account.extra.selectedCharacter.breed,
                            kamas: account.inventory.kamas
                                // kamas: accounts[username]["inventory"].kamas
                        }, ws)

                        /**weight**/
                        sendToBrowser("WEIGHT_UPDATE", {
                            username,
                            // items: accounts[username]["inventory"]["items"],
                            weight: account.inventory.weight.weight,
                            maxWeight: account.inventory.weight.maxWeight
                        }, ws)
                    }

                    /**stats**/
                    if (account.plugins.Fighter.stats && account.plugins.Fighter.stats.toSendStats) {
                        sendToBrowser("STATS_UPDATE", account.plugins.Fighter.stats.toSendStats)

                        /**health**/
                        sendToBrowser("HEALTH_UPDATE", {
                            username,
                            lifePoints: account.plugins.Fighter.stats.lifePoints,
                            maxLifePoints: account.plugins.Fighter.stats.maxLifePoints
                        }, ws)
                    }

                    /**spells**/
                    if (account.plugins.Fighter["spells"] && account.extra.selectedCharacter) {
                        const spellsToUpgrade = configs[username].autoUpgradeSpells[account.extra.selectedCharacter.breed] || []
                        sendToBrowser("SPELLS_UPDATE", {
                            username,
                            spells: account.plugins.Fighter["spells"],
                            spellPoints: account.plugins.Fighter.stats.spellsPoints,
                            characterLevel: account.extra.selectedCharacter.level,
                            autoUpgrade: spellsToUpgrade
                        }, ws)
                    }

                    /**shop**/
                    for (const object of account.plugins.Shop.itemsOnSale) {
                        sendToBrowser("SHOP_UPDATE", {
                            username,
                            item: object
                        }, ws)
                    }



                    /**fight_instructions**/
                    if (account.extra.selectedCharacter) {
                        sendToBrowser("FIGHT_INSTRUCTIONS", {
                            username,
                            instructions: account.plugins.Fighter.config.instructions[account.extra.selectedCharacter.breed] || []
                        }, ws)
                    }

                    /**jobs**/
                    if (account.jobs) {
                        sendToBrowser("JOB_UPDATE", {
                            username,
                            jobs: account.jobs
                        }, ws)
                    }

                    /**Notify client that he's ready to show container**/
                    sendToBrowser("SAUCE_READY", {
                            username
                        }, ws)
                        // }
                    break;


                case "gc":
                    global.collect()
                    break;

                    /**************************/
                case "LOGIN":
                    if (accounts[data.user]) {
                        const socket = accounts[data.user].socket;
                        if (socket) {
                            accounts[data.user]["manual"] = { script: false, reconnect: false };;
                            socket.send("disconnecting", "CLIENT_CLOSING");
                            break;
                        }
                    }
                    var account = new Account(data.user)
                    try {
                        sendToBrowser("LOG", { username: data.user, html: "<p class='info'>Connexion au serveur..</p>" })
                        const res = await account.login()
                            .catch(e => {
                                logger.error(e)
                                sendToBrowser("LOG", { username: data.user, html: `<p class='error'>${e.message}</p>` })
                                sendToBrowser("LOGIN_FAILED", { username: data.user, reason: e.message })
                            })
                        if (!res) break;

                        sendToBrowser("LOG", { username: data.user, html: "<p class='info'>Initialisation du Websocket..</p>" });
                        sendToBrowser("LOGIN_SUCCESS", { username: data.user });


                    } catch (e) {
                        logger.error(e)
                        sendToBrowser("LOGIN_FAILED", { username: data.user, reason: e.message })
                        break;
                    }


                    // if(list[data.user].script && list[data.user].script != "" && list[data.user].script.includes(".js")) sendToBrowser("AUTO_LOAD", {username: data.user, path: list[data.user].script})
                    if (!usernames.find(e => data.user == e)) break;
                    var accountData = readAccount(data.user + ".json")
                    if (!accountData.scriptPath) break;
                    const name = path.basename(accountData.scriptPath);
                    // console.log(list, list.find(e => e.username == data.user), name)
                    if (name) {
                        var code = await new Promise((resolve) => {
                            fs.readFile(accountData.scriptPath, 'utf8', function(err, fileData) {
                                if (err) {
                                    logger.error(err.message);
                                    sendToBrowser("LOG", {
                                        username: data.user,
                                        html: `<p class='error'>Le script <span style='color:white;'>${name}</span> n'a pas pu être chargé: <pre class='error'>${err.message}</pre></p>`
                                    })
                                    return resolve(null);
                                }

                                resolve(fileData)
                            });
                        })
                        if (!code) break;

                        var sessID = accounts[data.user].sessionID
                        await new Promise(r => {
                            const i = setInterval(() => { if (accounts[data.user] && accounts[data.user].state == "IDLE") r(clearInterval(i)) }, 1000)
                        })
                        if (sessID != accounts[data.user].sessionID) break;

                        ws.emit("message", (
                            JSON.stringify({
                                message: "LOAD_SCRIPT",
                                data: {
                                    username: data.user,
                                    name,
                                    code,
                                    path: accountData.scriptPath
                                }
                            })
                        ))
                    }
                    break;

                case "MODERATOR":
                    setTimeout(() => {
                        ws.emit("message", JSON.stringify({
                            message: "LOGIN",
                            data: {
                                user: data.username
                            }
                        }))
                    }, 1800000)
                    break;


                case "IMPORT":
                    try {
                        if (usernames.includes(data.username)) sendToBrowser("IMPORT", { reason: "Un compte avec le même nom d'utilisateur existe déjà" })
                        else {
                            usernames.push(data.username)
                            configs[data.username] = data.config;
                            var account = {...data }
                            delete account.username
                            fs.writeFileSync("./accounts/" + data.username + ".json", JSON.stringify(account, null, 4));

                            accountsData.push(account)
                            accountsData[accountsData.length - 1].username = data.username

                            sendToBrowser("IMPORT", { username: data.username })
                        }
                    } catch (e) {
                        logger.error(e)
                        sendToBrowser("IMPORT", { reason: e.message })
                    }
                    break;


                case "REMOVE_ACCOUNT":
                    try {
                        if (!usernames.find(e => data.username == e)) break;
                        else {
                            usernames = usernames.filter(e => e != data.username)
                            fs.unlinkSync("./accounts/" + data.username + ".json");
                            if (accounts[data.username]) {
                                const socket = accounts[data.username].socket;
                                if (socket) {
                                    socket.send("disconnecting", "CLIENT_CLOSING");
                                    break;
                                }
                            }
                            delete configs[data.username]

                            accountsData = accountsData.filter(e => e.username != data.username);
                            delete logs[data.username]
                        }
                    } catch (e) {
                        logger.error(e)
                    }
                    break;


                case "SEND_CHAT":
                    if (data.content.charAt(0) == "$") {
                        // return eval(`plugins.Map.${content.slice(1)}`)
                        eval(`${data.content.slice(1)}`);
                        break;
                    }
                    const socket = accounts[data.username].socket;
                    if (!socket) break;
                    plugins.Chat.general(socket, data.content)
                    break;


                case "LOAD_SCRIPT":
                    if (!accounts[data.username]) break;
                    var toLoad = [data.username]
                    var party = parties.find(party => party.members.includes(data.username))
                    if (party) {
                        if (party.leader != data.username) {
                            sendToBrowser("LOG", {
                                username: data.username,
                                html: `<p class = 'error'>Seul le chef du groupe peut charger le script.</p>`
                            })
                            break;
                        }

                        toLoad = party.members;
                    }

                    // if(!data.code){
                    if (!favScripts.includes(data.name)) {
                        if (!data.code) {
                            sendToBrowser("LOG", {
                                username: data.username,
                                html: `<p class = 'info'>Le chargement du script <span style='color:white;'>${data.name}</span> a échoué: <pre class = 'error'>Le script n'existe pas.</pre></p>`
                            })
                        }
                    } else {
                        data.path = './scripts/' + data.name;
                        // data.code = fs.readFileSync(data.path);
                        var i = accountsData.findIndex(e => e.username == data.username)
                        accountsData[i].scriptPath = data.path
                        fs.writeFileSync("./accounts/" + data.username + ".json", JSON.stringify(accountsData[i], null, 4))
                    }
                    // }

                    for (var username of toLoad) {
                        try {
                            if (accounts[username].script && accounts[username].script.running) accounts[username].script.forceStopScript()
                            accounts[username]["script"] = new scriptLoader(username, data.name, data.code, ws);
                            sendToBrowser("LOG", {
                                username: username,
                                html: `<p class = 'info'>Le script <span style='color:white;'>${data.name}</span> est chargé.</p>`
                            })
                            sendToBrowser("SCRIPT_LOADED", {
                                username: username,
                                name: data.name
                            })

                            // console.log(list)
                            /*var account = readAccount(username + ".json")
                            account.scriptPath = data.path;
                            fs.writeFileSync("./accounts/" + username + ".json", JSON.stringify(account, null, 4))*/
                        } catch (error) {
                            logger.warn(`[${username}] Script | Script ${data.name} failed to load.`)

                            sendToBrowser("LOG", {
                                username: username,
                                html: `<p class = 'info'>Le chargement du script <span style='color:white;'>${data.name}</span> a échoué: <pre class = 'error'>${error.message}</pre></p>`
                            })

                        }
                    }

                    if (favScripts.includes(data.name)) {
                        if (fs.readFileSync("./scripts/" + data.name) != data.code) fs.writeFileSync("./scripts/" + data.name, data.code)
                    }
                    break;
                case "RUN_SCRIPT":
                    if (!accounts[data.username] || !accounts[data.username].script.run || accounts[data.username].script.running) break;

                    var toRun = [data.username]

                    var party = parties.find(party => party.members.includes(data.username))
                    if (party) {
                        if (party.leader != data.username) {
                            sendToBrowser("LOG", {
                                username: data.username,
                                html: `<p class = 'error'>Seul le chef du groupe peut lancer le script.</p>`
                            })
                            break;
                        }
                        if (!party.checkReady()) {
                            sendToBrowser("LOG", {
                                username: data.username,
                                html: `<p class = 'error'>Le groupe n'est pas encore prêt à bouger.</p>`
                            })
                            break;
                        }

                        var toRun = party.members
                    }

                    for (var username of toRun) {
                        try {
                            accounts[username].script.run();
                        } catch (e) {
                            sendToBrowser("LOG", {
                                username,
                                html: `<p class = 'error'>Le script <span style='color:white;'>${accounts[username].script.name}</span> à rencontré une erreur.</p>`
                            })
                            sendToBrowser("LOG", {
                                username,
                                html: `<pre class = 'error'>${e}</pre>`
                            })
                            sendToBrowser("SCRIPT_LOADED", {
                                username
                            })
                        }
                    }
                    break;


                case "STOP_SCRIPT":
                    if (!accounts[data.username] || !accounts[data.username].script.run || !accounts[data.username].script.running) break;

                    var toStop = [data.username]
                    var party = parties.find(party => party.members.includes(data.username))
                    if (party) {
                        if (party.leader != data.username) {
                            sendToBrowser("LOG", {
                                username: data.username,
                                html: `<p class = 'error'>Seul le chef du groupe peut arrêter le script.</p>`
                            })
                            break;
                        }

                        toStop = party.members;
                    }
                    for (var username of toStop) {
                        accounts[username].script.forceStop = true;
                        accounts[username].script["running"] = false;

                        accounts[username].script.forceStopScript();
                    }
                    break;


                case "MOVE_ITEM":
                    if (!accounts[data.username] || !accounts[data.username]["inventory"]["items"]) break;

                    const item = accounts[data.username]["inventory"]["items"].find(e => e.UID == data.UID);
                    if (!item) break;

                    if (equipements.includes(item.type.type)) {
                        accounts[data.username].socket.sendMessage("ObjectSetPositionMessage", {
                            objectUID: item.UID,
                            position: data.position,
                            quantity: 1
                        })
                    } else if (item.type.type == 6) {
                        accounts[data.username].socket.sendMessage("ObjectUseMessage", {
                            objectUID: item.UID
                        })
                    }
                    break;
                case "UPGRADE_STAT":
                    if (!accounts[data.username] || !accounts[data.username].plugins["Fighter"]["stats"]) break;

                    // console.log(data)
                    accounts[data.username].socket.sendMessage("StatsUpgradeRequestMessage", {
                        boostPoint: data.cost,
                        statId: characCodes[data.statName],
                        useAdditionnal: false
                    })

                    break;


                case "UPGRADE_SPELL":
                    if (!accounts[data.username] || !accounts[data.username].plugins.Fighter.spells.find(e => e.id == data.spellId)) break;

                    accounts[data.username].socket.sendMessage("SpellUpgradeRequestMessage", {
                        spellId: data.spellId,
                        spellLevel: data.level
                    })

                    break;


                case "MOVE_TO_CELL":
                    if (!accounts[data.username] || !accounts[data.username].plugins.Map || !["WAITING FOR PARTY", "IDLE"].includes(accounts[data.username].state) || (accounts[data.username].script && accounts[data.username].script.running)) break;

                    await plugins.Map.moveToCell(data.username, data.cell)

                    sendToBrowser('CLEAR_PATH', {
                        username: data.username
                    })
                    break;


                case "FIGHT":
                    if (!accounts[data.username] || !accounts[data.username].plugins.Map || !["IDLE"].includes(accounts[data.username].state) || (accounts[data.username].script && accounts[data.username].script.running)) break;

                    await plugins.Map.moveToCell(data.username, data.cell)

                    accounts[data.username].socket.sendMessage("GameRolePlayAttackMonsterRequestMessage", {
                        monsterGroupId: data.id
                    })

                    break;


                case "USE_INTERACTIVE":
                    if (!accounts[data.username] || !accounts[data.username].plugins.Map || !["WAITING FOR PARTY", "IDLE"].includes(accounts[data.username].state) || (accounts[data.username].script && accounts[data.username].script.running)) break;

                    console.log(data)
                    await plugins.Map.useInteractiveElement(data.username, data.id, data.skill, data.lock)

                    break;


                case "MOVE_SIDE":
                    if (!accounts[data.username] || !accounts[data.username].plugins.Map || !["WAITING FOR PARTY", "IDLE"].includes(accounts[data.username].state) || (accounts[data.username].script && accounts[data.username].script.running)) break;

                    var party = parties.find(party => party.leader == data.username)
                    var toMove = [data.username]

                    if (party) {
                        for (const member of party.members) {
                            if (accounts[member] && ["WAITING FOR PARTY", "IDLE"].includes(accounts[member].state) &&
                                (accounts[member].plugins.Map.id && (accounts[member].plugins.Map.id == accounts[party.leader].plugins.Map.id))
                            ) {
                                toMove.push(member)
                            }
                        }
                    }

                    for (var username of toMove) {
                        try {
                            await plugins.Map.moveToSide(username, data.side)
                        } catch (e) {
                            console.log(e.message)
                            return;
                        }
                    }
                    break;


                case "REFRESH_SHOP":
                    if (!accounts[data.username] || !accounts[data.username].plugins.Shop) break;

                    try {
                        await plugins.Shop.openSellShop(data.username)
                        await plugins.Shop.closeShop(data.username)
                    } catch (e) {
                        return;
                    }
                    break;


                case "CREATE_CHARACTER":
                    if (!configs[data.username] || configs[data.username].createCharacter) break;

                    configs[data.username]["createCharacter"] = { breed: data.breed }
                    sendToBrowser("CREATE_CHARACTER_CONFIRM", {
                        username: data.username,
                        breed: breeds[data.breed]
                    })
                    break;


                case "CANCEL_CHARACTER_CREATION":
                    if (configs[data.username].createCharacter) delete configs[data.username]["createCharacter"];

                    sendToBrowser("CREATE_CHARACTER_CONFIRM", {
                        username: data.username
                    })
                    break;


                case "SAVE_CONFIG":
                    if (!configs[data.username]) break;

                    var createCharacter = configs[data.username].createCharacter;

                    data.config["autoUpgradeCharac"] = configs[data.username].autoUpgradeCharac;
                    data.config["autoUpgradeSpells"] = configs[data.username].autoUpgradeSpells;

                    configs[data.username] = data.config;

                    configs[data.username].createCharacter = createCharacter;

                    if (!usernames.includes(data.username)) break;
                    var account = readAccount(data.username + ".json");
                    account.config = data.config;
                    fs.writeFileSync("./accounts/" + data.username + ".json", JSON.stringify(account, null, 4))

                    var i = accountsData.findIndex(e => e.username == data.username)
                    accountsData[i] = account;
                    accountsData[i].username = data.username
                    break;


                case "SIT":
                    if (!accounts[data.username] || !accounts[data.username].socket) break;
                    plugins.Misc.sit(data.username)
                    break;


                case "ADD_INSTRUCTION":
                    if (!accounts[data.username]) break;

                    if (!accounts[data.username].plugins.Fighter.config.instructions[accounts[data.username].extra.selectedCharacter.breed]) {
                        accounts[data.username].plugins.Fighter.config.instructions[accounts[data.username].extra.selectedCharacter.breed] = []
                    }
                    accounts[data.username].plugins.Fighter.config.instructions[accounts[data.username].extra.selectedCharacter.breed].push(data.instruction)

                    if (accounts[data.username].plugins.Fighter.fighting) {
                        accounts[data.username].plugins.Fighter.spellsToUse = {}
                        const instructions = accounts[data.username].plugins.Fighter.config.instructions[accounts[data.username].extra.selectedCharacter.breed] || []
                        for (const instruction of instructions) {
                            const spell = accounts[data.username].plugins.Fighter.spells.find(e => e.id == instruction.spellId);
                            accounts[data.username].plugins.Fighter.spellsToUse[instruction.spellId] = {
                                currentCooldown: spell.spellLevel.initialCooldown,
                                castsThisTurn: 0,
                                error: false
                            }
                        }
                    }

                    break;


                case "REMOVE_INSTRUCTION":
                    if (!accounts[data.username]) break;

                    delete accounts[data.username].plugins.Fighter.config.instructions[accounts[data.username].extra.selectedCharacter.breed][data.index]
                    accounts[data.username].plugins.Fighter.config.instructions[accounts[data.username].extra.selectedCharacter.breed] = accounts[data.username].plugins.Fighter.config.instructions[accounts[data.username].extra.selectedCharacter.breed].filter(e => e != null)

                    var account = readAccount(data.username + ".json")
                    account.fightConfig = accounts[data.username].plugins.Fighter.config
                    fs.writeFileSync("./accounts/" + data.username + ".json", JSON.stringify(account, null, 4))

                    if (accounts[data.username].plugins.Fighter.fighting) {
                        accounts[data.username].plugins.Fighter.spellsToUse = {}
                        const instructions = accounts[data.username].plugins.Fighter.config.instructions[accounts[data.username].extra.selectedCharacter.breed] || []
                        for (const instruction of instructions) {
                            const spell = accounts[data.username].plugins.Fighter.spells.find(e => e.id == instruction.spellId);
                            accounts[data.username].plugins.Fighter.spellsToUse[instruction.spellId] = {
                                currentCooldown: spell.spellLevel.initialCooldown,
                                castsThisTurn: 0,
                                error: false
                            }
                        }
                    }

                    break;


                case "SAVE_FIGHTER_CONFIG":
                    if (!accounts[data.username]) break;

                    var instructions = accounts[data.username].plugins.Fighter.config.instructions
                    accounts[data.username].plugins.Fighter.config = data.config
                    accounts[data.username].plugins.Fighter.config.instructions = instructions
                    var account = readAccount(data.username + ".json")
                    account.fightConfig = accounts[data.username].plugins.Fighter.config
                    fs.writeFileSync("./accounts/" + data.username + ".json", JSON.stringify(account, null, 4))

                    var i = accountsData.findIndex(e => e.username == data.username)
                    accountsData[i] = account;
                    accountsData[i].username = data.username
                    break;


                case "AUTO_UPGRADE":
                    if (!configs[data.username]) break;

                    var account = readAccount(data.username + ".json")

                    if (data.carac) {
                        if (!Object.values(characCodes).includes(data.carac)) data.carac = null;
                        configs[data.username]["autoUpgradeCharac"][accounts[data.username].extra.selectedCharacter.breed] = data.carac;
                        account.config["autoUpgradeCharac"][accounts[data.username].extra.selectedCharacter.breed] = data.carac;
                    }

                    if (data.spells) {
                        configs[data.username]["autoUpgradeSpells"][accounts[data.username].extra.selectedCharacter.breed] = data.spells;
                        account.config["autoUpgradeSpells"][accounts[data.username].extra.selectedCharacter.breed] = data.spells;
                    }
                    fs.writeFileSync("./accounts/" + data.username + ".json", JSON.stringify(account, null, 4))

                    var i = accountsData.findIndex(e => e.username == data.username)
                    accountsData[i] = account;
                    accountsData[i].username = data.username
                    break;


                case "QUIT_FIGHT":

                    var party = parties.find(party => party.leader == data.username)
                    var toMove = [data.username]

                    if (party) {
                        for (const member of party.members) {
                            if (accounts[member]) toMove.push(member)
                        }
                    }

                    for (var username of toMove) {
                        if (!accounts[username] || !accounts[username].plugins.Fighter.fighting) continue;
                        accounts[username].socket.sendMessage("GameContextQuitMessage");
                    }
                    break;


                case "LEAVE_DIALOG":
                    if (!accounts[data.username]) break;
                    plugins.Npc.leave(data.username)
                    sendToBrowser("LOG", {
                        username: data.username,
                        html: `<p class='info'>Le packet <span style='color:white;'>LeaveDialogMessage</span> à été envoyée.`
                    })
                    break;


                case "INIT_PARTY":
                    const slaves = data.slaves.filter(function(username, i) {
                        return usernames.includes(username) && data.slaves.indexOf(username) == i
                    })
                    const leader = usernames.includes(data.leader) ? data.leader : null
                    if (slaves.length < 1 || !leader) {
                        logger.error("Les membres du groupes doivent être au moins 2")
                        break;
                    }
                    var party = new Party(leader, slaves, data.id);
                    parties.push(party)

                    party.login(ws)
                        // console.log(res)
                    break;


                case "DELETE_PARTY_MEMBER":
                    var party = parties.find(party => party.members.includes(data.username))
                    if (!party) break;

                    party.deleteMember(data.username)
                    break;

                case "ADD_PARTY_MEMBER":
                    var party = parties.find(party => party.partyId == data.id)
                    if (!party) break;

                    party.addMember(data.username, ws)
                    break;


                case "PURGE_PARTY":
                    var party = parties.findIndex(party => party.partyId == data.id)
                    if (party == -1) break;

                    parties[party].purge()
                    delete global.parties[party]
                    global.parties = global.parties.filter((_, i) => i != party)
                    break;

                case "LIVE_SCRIPT":
                    const live = new scriptLoader(data.username, "live", data.code, ws)
                    break;

                case "CLEAR_LOGS":
                    if (usernames.includes(data.username)) {
                        logs[data.username] = ""
                        sendToBrowser("LOGS", {
                            username: data.username,
                            logs: logs[username] || ""
                        })
                    }

            }
        })

    })


    app.get("/login", async(req, res) => {
        if (req.cookies["auth"]) {
            if (req.cookies["auth"] != global.p(key, "ajitchofzabikikber")) {
                res.clearCookie()
            } else return res.redirect('/');
        }

        res.render(path.join(__dirname, 'src/Public/login.html'), {
            version
        });
    })

    app.post("/hh", async(req, res) => {
        if (!req.body || !req.body.key || req.body.key != key) return res.status(401).end();

        if (req.cookies["auth"]) {
            if (req.cookies["auth"] != global.p(key, "ajitchofzabikikber")) {
                res.clearCookie()
            }
            return res.redirect('/');
        }
        res.cookie(`auth`, global.p(req.body.key, "ajitchofzabikikber"), {
            secure: true,
            sameSite: 'lax'
        });

        res.end("ok")
    })

    app.get("/", async(req, res) => {
        if (req.cookies["auth"]) {
            if (req.cookies["auth"] != global.p(key, "ajitchofzabikikber")) {
                res.clearCookie()
                return res.redirect("/login")
            }
            var anticaptcha = "";
            await new Promise(resolve => {
                fs.readFile("anticaptcha.txt", "utf8", (e, data) => {
                    if (e) return resolve();
                    anticaptcha = data.trim()
                    resolve()
                })

            })

            res.render(path.join(__dirname, 'src/Public/index.html'), {
                cpu: 420,
                ram: ((Object.values(process.memoryUsage()).reduce((a, b) => a + b)) / (1024 ** 2)).toFixed(2),
                ping: 666,
                app: metadata.appVersion,
                build: metadata.buildVersion,
                assets: metadata.assetsVersion,
                version,
                anticaptcha
            });
        } else res.redirect("/login")

    })
    app.post("/probe", (req, res) => {
        res.end("slm hh");
    })
    const server = app.listen(port, async() => {
        logger.info(`Midnite Bot prêt, naviguez depuis n'importe quel appareil pour l'utiliser.`)

        const privateIp = getIPAddress()
            /*var states = await Promise.all([
            	ping.promise.probe(externalIp, {
            		timeout: 2
            	}), 
            	ping.promise.probe(privateIp, {
            		timeout: 2
            	})
            ])
            states = states.map(e=>!isNaN(parseInt(e.avg)) ? "\x1b[32mUP\x1b[0m" : "\x1b[31mDOWN\x1b[0m")*/

        var states = await Promise.all([
            probe(`http://${externalIp}:${server.address().port}/probe`, {
                timeout: 2
            }),
            probe(`http://${privateIp}:${server.address().port}/probe`, {
                timeout: 2
            })
        ])


        console.log(`
	Liens:
		Publique: \x1b[33m${externalIp}:${server.address().port}\x1b[0m [${states[0]}] (N'oubliez pas d'ouvrir les ports depuis votre routeur et votre machine)
		Local: \x1b[33m${privateIp}:${server.address().port}\x1b[0m [${states[1]}] (Tous les machines sur le même réseau peuvent acceder depuis ce lien)
	`)
    }).on('error', e => {
        if (e.code == "EADDRINUSE") logger.error(`Le port ${port} est occupé, liberez le avant d'utiliser Midnite bot.`)
        else logger.error(e);
    });

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, socket => {
            wss.emit('connection', socket, request);
        });
    });

    setInterval(() => {
        const startTime = process.hrtime()
        const startUsage = process.cpuUsage()

        // spin the CPU for 500 milliseconds
        const now = Date.now()
        while (Date.now() - now < 500) continue;

        const elapTime = process.hrtime(startTime)
        const elapUsage = process.cpuUsage(startUsage)

        const elapTimeMS = secNSec2ms(elapTime)
        const elapUserMS = secNSec2ms(elapUsage.user)
        const elapSystMS = secNSec2ms(elapUsage.system)
        const cpuPercent = ((elapUserMS + elapSystMS) * 100 / elapTimeMS).toFixed(2)

        sendToBrowser("STATS", {
            cpu: cpuPercent,
            // mem: mem.residentSet + mem.shared + mem["private"]
            mem: ((Object.values(process.memoryUsage()).reduce((a, b) => a + b)) / (1024 ** 2)).toFixed(2)
        });
    }, 2500)

})()



function secNSec2ms(secNSec) {
    if (Array.isArray(secNSec)) {
        return secNSec[0] * 1000 + secNSec[1] / 1000000;
    }
    return secNSec / 1000;
}


function getIPAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];

        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
                return alias.address;
        }
    }
    return '0.0.0.0';
}

function probe(url) {
    return new Promise(async resolve => {
        const id = setTimeout(() => resolve("\x1b[31mDOWN\x1b[0m"), 3000);
        const res = await got.post(url).catch(e => resolve("\x1b[31mDOWN\x1b[0m"));
        if (res && res.body == "slm hh") resolve("\x1b[32mUP\x1b[0m")
        else resolve("\x1b[31mDOWN\x1b[0m")
    })
}



process.on('unhandledRejection', (reason, promise) => {
    logger.error("Unhandled rejection: " + reason)
    console.log(promise)
        // console.log('reason is', reason);
        // console.log('promise is', promise);
});
process.on('uncaughtException', function(err) {
    console.log('Error:', err.message);
});