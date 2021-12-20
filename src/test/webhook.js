const cloudscraper = require("cloudscraper");
/*const got = require("got")



got.post("https://discord.com/api/webhooks/877897573292183593/wKS3raGccWLohEbPen8oCqkutM5HwDaZKpkb-NEeeD_2LB0Jhhc_6ekCszvM3_nC8lBI", {
	body: JSON.stringify({
		content: "you gotta figure out how to make requests f LUA w safi"
	}),
	headers: {'Content-type': 'application/json'}
}).then(()=>console.log("done"))
.catch(e=>console.log(e.message))*/

const nicknamePrefix = "MidniteSky"

async function validateGuest(login, password, guestLogin, guestPassword, retValue = ""){
	const params = new URLSearchParams({
		login,
		password,
		email: "aurore.provost.dj@gmail.com",
		nickname: nicknamePrefix + Math.floor(Math.random() * (10**4)),
		birthDateTimestamp: 968112000000,
		parentEmail: "",
		guestLogin,
		guestPassword,
		lang: "fr"
	}).toString()	
	const res = await new Promise((resolve, reject) => {
		cloudscraper(`https://proxyconnection.touch.dofus.com/haapi/validateGuest?${params}`, (e, res, body) => {
			if(e) reject(e);
			console.log(res.headers)
			resolve(res)
		}).catch(e=>{reject(e)})
	})
	
	// console.log(res.body)
	if(JSON.parse(res.body).key == "ankama_login_exist"){
		const newLogin = JSON.parse(res.body).suggests.sort(function(a, b) {
			return a.length - b.length;
		})[0];
		console.log(`\x1b[33m${JSON.parse(res.body).key}, trying again with ${newLogin}..\x1b[0m`)
		return await validateGuest(newLogin, password, guestLogin, guestPassword, "|login_changed|"+newLogin)
	}
	return (res.body.includes("_headers") && !JSON.parse(res.body).key) ? "SUCCESS"+retValue : `\x1b[31m${res.body}\x1b[0m`
}

validateGuest("Midnite6666", "aspirine12", '[GUEST]f3519d6b14896b4d9', 'xEH1hZ4tB4s4').then(console.log)