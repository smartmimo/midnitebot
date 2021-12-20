const got = require("got");

//Hooking the plugin
module.exports = class captcha {
	constructor() {
		this.captchas = {};
		this.listeners = [
			this.RecaptchaRequestMessage
		];
	}
	async RecaptchaRequestMessage(payload){
		const {socket, data} = payload
		
		sendToBrowser("CAPTCHA", {
			username: socket.account.username,
			key: data.enrichData.sitekey
		})
		sendToBrowser("LOG", {
			username: socket.account.username,
			html: "<p class='warn'>Captcha detecté, contournement..</p>"
		})
		
		plugins.Captcha.captchas[socket.account.username] = data.enrichData.sitekey
		// var response = await solveCaptcha(data.enrichData.sitekey)
		/*if(response.solution==undefined) console.log(response)
		else socket.send("recaptchaResponse", response.solution.gRecaptchaResponse)*/
	}
	
	async solveCaptcha(username, key, captchaKey){
		let data={
			"clientKey": captchaKey,
			"task": {
				"type":"NoCaptchaTaskProxyless",
				"websiteURL":"https://proxyconnection.touch.dofus.com",
				"websiteKey":key
			},
		}
		
		const response = await got.post('http://api.anti-captcha.com/createTask', {
			body: JSON.stringify(data),
			headers: {'Content-Type': 'application/json'},
			responseType: 'json'
		});
		if(response.body.errorId != 0) return sendToBrowser("LOG", {username, html: "<p class='error'>CAPTCHA: "+response.body.errorDescription+"</p>"})
			
		data={
			"clientKey": captchaKey,
			"taskId": response.body["taskId"]
		}

		while (true){
			await new Promise(r=>setTimeout(r, 2000));
			var r = await got.post('http://api.anti-captcha.com/getTaskResult', {
				body:JSON.stringify(data),
				headers: {'Content-Type': 'application/json'},
				responseType: 'json'
			});
			r = r.body
			if (r.status == "ready"){
				if(r.solution == undefined) sendToBrowser("LOG", {username, html: "<p class='error'>CAPTCHA: "+JSON.stringify(r, null, 4)+"</p>"})
				else{
					accounts[username].socket.send("recaptchaResponse", r.solution.gRecaptchaResponse)
					delete global.plugins.Captcha.captchas[username]
				}
				break;
			}
			if(r.status=="processing"){
				sendToBrowser("LOG", {username, html: "<p class='info'>CAPTCHA: Attente de la réponse..</p>"})
				continue;
			}
			sendToBrowser("LOG", {username, html: "<p class='error'>CAPTCHA: "+JSON.stringify(r, null, 4)+"</p>"})
			break;
		}
		
	}
}
