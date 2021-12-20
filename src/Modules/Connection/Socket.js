const Primus = require("primus");
const constants = require("../../Config/constants.json")
const logger = require("../../Libs/Logger.js")
const EventEmitter = require("../../Libs/EventEmitter.js")

const fs = require("fs");
const HttpsProxyAgent = require("https-proxy-agent");

const PrimusSocket = Primus.createSocket({
	// transformer: "engine.io"
	transformer: "websockets"
});

const primusOptions = {
	manual: true,
	strategy: "disconnect,timeout",
	reconnect: {
		max: 5000,
		min: 500,
		retries: 0
	}
};

/*function loadPlugins(){
	var listeners = [];

		const pluginNames = fs
			.readdirSync("./src/Plugins/", { withFileTypes: true })
			.filter(file => file.isDirectory())
			.map(fileInfo => fileInfo.name);
			
		for (let pluginName of pluginNames) {
			const Plugin = require(`../../Plugins/${pluginName}/index.js`);
			plugins[pluginName] = new Plugin();
			listeners = listeners.concat(
				plugins[pluginName].listeners
			);
			delete global.plugins[pluginName].listeners;
		}
	return listeners;
}*/

module.exports = class Socket extends PrimusSocket {
	constructor(sessionID, username) {
		
		const socketUrl = Socket.getUrl(accounts[username].state, accounts[username], sessionID);
		
		const proxy = configs[username].proxy.enabled ? "http://"+configs[username].proxy.proxyString : null;
		primusOptions.transport = {
			agent: proxy ? new HttpsProxyAgent(proxy) : null
		}
		
		super(socketUrl, primusOptions);
		this.phase = accounts[username].state;
		this.account = {
			username
			// salt: "",
			// key: []
		};
		this.server = "login";
		
		// this.opened = false
	}

	async send(call, data = null) {
		const payload = {
			call,
			data
		};
		this.write({ call, data });

		// DEBUG
		const message =
			payload.call === "sendMessage" ? payload.data.type : payload.call;
		logger.debug(`[${this.account.username}]: SOCKET | \u001b[32mSND\u001b[37m | ${message}`);
		
	}

	async sendMessage(type, data) {
		// Emitter
		this.send("sendMessage", { type, data });
	}

	async load(allListeners) {
		
		const { appVersion, buildVersion } = metadata;
		this.eventEmitter = new EventEmitter();
		let listeners = allListeners.auth;

		console.log(allListeners.auth);
		if (this.phase === "SWITCHING TO GAME") {
			const account = accounts[this.account.username];
			this.server = {
				address: account.auth.selectedServerData.address,
				port: account.auth.selectedServerData.port,
				id: account.auth.selectedServerData.id
			};
			try{
				// const pluginListeners = loadPlugins();
				const pluginListeners = plugins.listeners;
				listeners = [].concat(allListeners.game, pluginListeners);
			} catch(e){
				console.log(e)
				this.send("disconnecting", "CLIENT_CLOSING");
			}
			

		}
		this.eventEmitter.on(listeners);
		// console.log(listeners)
		// console.log(this)
		
		this.on("open", () => {
			if (accounts[this.account.username].state === "SWITCHING TO GAME") setState(this.account.username, "INITIALIZING")
			this.send("connecting", {
				language: "fr",
				server: this.server,
				client: "android",
				// appVersion: "3.2.1",
				appVersion,
				// buildVersion: "1.51.0-3"
				buildVersion
			});
			// }
		})
			.on("data", data => {
				const payload = {
					socket: this,
					data
				};
				logger.debug(
					`[${this.account.username}]: SOCKET | \u001b[33mRCV\u001b[37m | ${data._messageType}`
				);
				this.eventEmitter.emit(data._messageType, payload);
			})
			.on("error", error => {
				logger.error(new Error("SOCKET: " + error));
				sendToBrowser("LOG", {
					username: this.account.username,
					html: `<p class='error'>Deconnexion du Websocket: ${error.message}</p>`
				})
				setState(this.account.username, "OFFLINE")
				this.destroy();
			})
			.on("end", async () => {
				if (accounts[this.account.username] && accounts[this.account.username].state === "SWITCHING TO GAME"){
					logger.debug(`[${this.account.username}]: SOCKET | \u001b[33mSWITCHING TO GAME SERVER`);
				} else {
					logger.warn(`[${this.account.username}]: DISCONNECTED`);
					
					if(accounts[this.account.username]["reason"]) setState(this.account.username, accounts[this.account.username]["reason"])
					else setState(this.account.username, "OFFLINE")
				
					var reason;
					
					if(accounts[this.account.username]["manual"]){
						reason = accounts[this.account.username].manual.script ? "Deconnexion demandée par le script" : "Deconnexion demandée par l'utilisateur"
						if(accounts[this.account.username].manual.reconnect){
							reason = reason + ". Reconnexion dans " + accounts[this.account.username].manual.reconnect + "ms"
						}
					} else if(accounts[this.account.username]["reason"]){
						if(accounts[this.account.username]["reason"] == "WAITING_FOR_MODERATOR") reason = "DISCONNECTED: Attente du modérateur (30 mins)"
					} else reason = "DISCONNECTED"
					
					sendToBrowser("LOGIN_FAILED", {
						username: this.account.username,
						reason
					})
					
					sendToBrowser("LOG", {
						username: this.account.username,
						html: `<p class='error'>${reason}</p>`
					})
					
					delete global.accounts[this.account.username];
					
					const pluginListeners = plugins.listeners;
					listeners = [].concat(allListeners.game, pluginListeners);
					this.eventEmitter.off(listeners)
					delete this.eventEmitter;
					this.destroy();
				}
			})
			.open();
	}

	static getUrl(phase, account, sessionID) {
		let socketUrl = "https://proxyconnection.touch.dofus.com";
		// let socketUrl = configs[this.account.username].server == "Early" ? "https://earlyproxy.touch.dofus.com" : "https://proxyconnection.touch.dofus.com";
		if (phase === "SWITCHING TO GAME") {
			const auth = account.auth;
			socketUrl = auth.selectedServerData.access;
		}
		let url = new URL(socketUrl);
		url.pathname = "/primus/";
		url.searchParams.append("STICKER", sessionID);
		return url.href;
	}
	
	
}
