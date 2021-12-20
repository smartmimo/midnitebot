const got = require("got")
const constants = require("../Config/constants.json")
const logger = require("./Logger.js")
const HttpsProxyAgent = require("https-proxy-agent");


async function getAppVersion(proxy) {
	const params = new URLSearchParams({
		country: "fr",
		id: 1041406978,
		lang: "fr",
		limit: 1
	});
	try {
		const response = await got(constants.app.url + "?" + params.toString(), {
			agent: proxy ? new HttpsProxyAgent(proxy) : null,
		});
		// console.log(response)
		return JSON.parse(response.body).results[0].version;
	} catch (error) {
		console.error(error);
	}
}

// getAppVersion is working
function getBuildVersion(proxy) {
	const url = constants.baseUrl + constants.entries.build;

	const regex = /.*buildVersion=("|')([0-9]*\.[0-9]*\.[0-9]*)("|')/g;
	return new Promise(async (resolve, reject) => {
		let request = await got
			.stream(url, {agent: proxy ? new HttpsProxyAgent(proxy) : null})
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
	const url = `${constants.baseUrl}${constants.entries.assets}`;
	try {
		const { body } = await got(url, {agent: proxy ? new HttpsProxyAgent(proxy) : null});
		
		const config = await got(constants.baseUrl + constants.entries.config);
		let assetsFullVersion = JSON.parse(config.body).assetsUrl.match(/\/([^/]+)\/?$/)[1];

		return {
			assetsFullVersion,
			assetsVersion: JSON.parse(body).assetsVersion,
			staticDataVersion: JSON.parse(body).staticDataVersion
		};
	} catch (error) {
		logger.error(error);
	}
}

module.exports = { getAppVersion, getBuildVersion, getAssetsVersion };

/* getBuildVersion(proxy)
	.then(console.log)
	.catch(console.log); */
