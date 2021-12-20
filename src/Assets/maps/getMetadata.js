const got = require("got")

// getAppVersion is working
function getBuildVersion() {
	const url = "https://proxyconnection.touch.dofus.com/build/script.js";

	const regex = /.*buildVersion=("|')([0-9]*\.[0-9]*\.[0-9]*)("|')/g;
	return new Promise(async (resolve, reject) => {
		let request = await got
			.stream(url)
			.on("data", buffer => {
				const chunk = buffer.toString("utf8");

				if (chunk.includes("window.buildVersion")) {
					let buildVersion = regex.exec(chunk)[2];
					request.emit("end");
					request.removeAllListeners();
					resolve(buildVersion);
				}
			})
			.on("error", reject);
	});
}

async function getAssetsVersion(proxy) {
	const url = `https://proxyconnection.touch.dofus.com/assetsVersions.json`;
	try {
		const { body } = await got(url);
		
		const config = await got("https://proxyconnection.touch.dofus.com/config.json");
		let assetsFullVersion = JSON.parse(config.body).assetsUrl.match(/\/([^/]+)\/?$/)[1];

		return {
			assetsFullVersion,
			assetsVersion: JSON.parse(body).assetsVersion,
			staticDataVersion: JSON.parse(body).staticDataVersion
		};
	} catch (error) {
		console.error(error);
	}
}

module.exports = {getBuildVersion, getAssetsVersion };

/* getBuildVersion(proxy)
	.then(console.log)
	.catch(console.log); */
