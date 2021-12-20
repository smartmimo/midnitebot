const got=require("got")
const fs=require("fs")
const BSON = require('bson');

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

(async ()=>{
	const assetsVersion = (await getAssetsVersion()).assetsFullVersion;
	const buildVersion = await getBuildVersion();
	
	console.log("Assets version: ", assetsVersion)
	console.log("Build version: ", buildVersion)
	
	const maps = JSON.parse(
		(await got.post('https://proxyconnection.touch.dofus.com/data/map?lang=fr&v='+buildVersion, {
			headers: {'Content-Type': 'application/json'},
			body: '{"class":"mapPositions","ids":[]}'
		})).body
	)
	// console.log(maps)
	var obj={}
	
	const length = Object.keys(maps).length;
	var count = 1;
	
	for(const i in maps){
		// if(i != 83888132) continue;
		console.log("Processing ",i , `(${count} / ${length})`)
		try{
			const mapData = await got('https://dofustouch.cdn.ankama.com/assets/'+assetsVersion+'/maps/'+i+'.json',{
				headers:{"Connection": "Keep-Alive"}
			})
			// console.log(mapData)
			fs.writeFile(i+'.bson', BSON.serialize(JSON.parse(mapData.body)), ()=>{})
		}
		catch(err){
			console.log(err.message)
		}
		count++
	}
})()

