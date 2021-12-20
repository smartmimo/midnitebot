const cloudscraper = require("cloudscraper");

cloudscraper.post("https://proxyconnection.touch.dofus.com/data/map?lang=fr&v=1.52.0", {
	body: JSON.stringify({
		"class": "spells",
		"ids": [
			
		]
	}),
	headers: {
		"content-type": "application/json; charset=utf-8"
	}
}).then(console.log)