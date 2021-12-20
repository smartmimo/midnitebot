// const {spawnSync} = require('child_process');
const cloudscraper = require('cloudscraper').defaults({
  agentOptions: {
    ciphers: 'AES256-SHA'
  }
})
// const HttpsProxyAgent = require("https-proxy-agent");
const {getAssetsVersion, getAppVersion, getBuildVersion} = require('../../Libs/getMetadata.js');

const logger = require('../../Libs/Logger.js');
const constants = require('../../Config/constants.json');
const fs = require("fs");
const auth = require("../Auth/index.js");
const game = require("../Game/index.js");
const Socket = require("./Socket.js");

module.exports = class {
	constructor(user) {
		this.account = JSON.parse(fs.readFileSync("./accounts/" + user + ".json"));
		this.account.username = user;
		// this.config = getConfig();
		this.auth = {
			apiKey: null,
			apiID: null,
			accountID: null,
			sessionID: null,
			token: null
		};
		this.listeners = { auth, game },
		this.pathfinder = require("../../Plugins/Map/pathfinder.js")();
	}

	async login() {
		logger.info(`[${this.account.username}]: Initiating login sequence.`);
		// sendToBrowser("LOG", "<p class='info'>Getting apiKey..")
		this.auth.apiKey = await this.getHaapi();
		this.auth.apiID = await this.getApiID();
		if(!this.auth.apiKey || !this.auth.apiID) return;
		this.auth.token = await this.getToken(
			this.auth.apiKey,
			this.auth.apiID
		);
		
		accounts[this.account.username] = {
			token: this.auth.token,
			sessionID: this.auth.sessionID,
			apiKey: this.auth.apiKey,
			state: "",
			auth: {},
			extra: {},
			socket: {},
			inventory: {},
			jobs: {},
			script: {
				running: false
			},
			currentSequenceNumber: 0,
			// mapId: -1,
			plugins: {
				Map: {
					id: -1,
					interactiveElements: {},
					statedElements: {},
					actors: {},
					houses: {},
					midgroundLayer: {}
				},
				Npc: {
					currentDialog: false,
					currentReplies: false
				},
				Fighter: {
					fighting: false,
					spells: [],
					config: this.account.fightConfig,
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
				},
				Shop: {
					buy: {
						opened: false
					},
					sell: {
						opened: false
					},
					itemsOnSale: [],
					maxSlots: -1
				},
				Exchange: {
					whitelisted: [],
					currentExchange: false
				}
			},
			pathfinder: this.pathfinder
		}
		
		setState(this.account.username, "LOGGING IN");

		// console.log(accounts[this.account.username].script)
		
		var connection = new Socket(this.auth.sessionID, this.account.username);
		connection.load(this.listeners)
		accounts[this.account.username].socket = connection;
		
		connection.once("destroy", async() => {
			if(!accounts[this.account.username]) return;
			connection = new Socket(this.auth.sessionID, this.account.username);
			if(!connection) return;
			connection.load(this.listeners);
			accounts[this.account.username].socket = connection;
		});
		
		return this.auth;
	}

	async getApiID() {
		logger.debug(`[${this.account.username}]: Getting ApiID..`);
		try {
			const uri = `${constants.baseUrl}${constants.entries.config}`;
			const proxy = configs[this.account.username].proxy.enabled ? 'http://'+configs[this.account.username].proxy.proxyString : null
			/*if(proxy){
				sendToBrowser("LOG", {
					username: this.account.username,
					html: `<p class='warn'>Utilisation du proxy: <span style='color:white;'>${proxy}</span></p>`
				})
			}*/
			const response = JSON.parse(await cloudscraper({
				uri,
				proxy
			}));
			this.auth.sessionID = response.sessionId;
			return response.haapi.id;
		} catch (error) {			
			throw error
		}
	}

	async getHaapi() {
		logger.debug(`[${this.account.username}]: Getting ApiKey..`);
		try {
			return await new Promise(async (resolve, reject) => {
				const uri = `${constants.haapiUrl}${constants.entries.haapi}`; 

				/*var response = spawnSync('python', ['./src/Modules/Connection/cs.py', this.account.username, this.account.password]);
				if(response.stdout.toString().includes("Cloudflare")){
					throw new Error(response.stdout.toString())
				} else if(response.stderr.toString() != ""){
					throw new Error(response.stderr.toString())
				}
				response = JSON.parse(response.stdout.toString())*/
				
				const headers = {
					"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.7278.552 Mobile Safari/537.36",
					Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
					"Accept-Language": ",en-US,en;q=0.9",
					"Accept-Encoding": "gzip, deflate",
					"Content-Type": "application/x-www-form-urlencoded"
				}
				
				const proxy = configs[this.account.username].proxy.enabled ? 'http://'+configs[this.account.username].proxy.proxyString : null
				if(proxy){
					sendToBrowser("LOG", {
						username: this.account.username,
						html: `<p class='warn'>Utilisation du proxy: <span style='color:white;'>${proxy}</span></p>`
					})
				}
				const options = {
					uri,
					proxy,
					body: new URLSearchParams({
						login: this.account.username,
						password: this.account.password,
						long_life_token: false,
						game_id: 18 //touch
					}).toString(),
					headers
				};
				
				if(!metadata.appVersion || !metadata.buildVersion || !metadata.assetsVersion){
					sendToBrowser("LOG", {
						username: this.account.username,
						html: `<p class='warn'>Versions introuvables, recherche de ces derniers avec le proxy: <span style='color:white;'>${proxy}</span></p>`
					})
					const [assets, appVersion, buildVersion] = await Promise.all([
						getAssetsVersion(proxy),
						getAppVersion(proxy),
						getBuildVersion(proxy)
					]);
					metadata = {
						appVersion,
						buildVersion,
						assetsVersion: assets.assetsVersion,
						assetsFullVersion: assets.assetsFullVersion,
						staticDataVersion: assets.staticDataVersion
					};
					sendToBrowser("VERSIONS", metadata)
				}
				const timeout = setTimeout(() => reject(new Error("Impossible de se connecter: TIMEOUT")), 10000)
				const res = await cloudscraper.post(options).catch(e=>{
					reject(e); 
				})
				
				if(!res || !timeout) return;
				
				clearTimeout(timeout)
				const response = JSON.parse(res);
				
				// console.log(response)
				if(response.reason){
					reject(new Error("Impossible de se connecter: "+response.reason));
					return;
				}
				// console.log(this)
				this.auth.accountID = response.account_id;
				sendToBrowser("LOG", {username: this.account.username, html: `<p class='info'>Connection avec l'ip <span style='color:white;'>${response.ip}</span></p>`});
				resolve(response.key);
			})
		} catch (error) {
			if(error.statusCode == 401) throw new Error("Impossible de se connecter: "+JSON.parse(error.error).reason);
			else if(error.message.includes("Cloudflare")) throw new Error("Impossible de se connecter, protection Cloudflare: " + error.statusCode);
			else throw error
		}
	}

	async getToken(apiKey, apiID) {
		logger.debug(`[${this.account.username}]: Getting Token..`);
		try {
			const uri = `${constants.haapiUrl}${constants.entries.token}?game=${apiID}`;
			const options = {
				uri,
				proxy: configs[this.account.username].proxy.enabled ? "http://"+configs[this.account.username].proxy.proxyString : null,
				headers: { apiKey }
				
			};
			const response = JSON.parse(await cloudscraper(options));
			// console.log(response.body.token);
			return response.token;
		} catch (error) {
			throw error
		}
	}
}
