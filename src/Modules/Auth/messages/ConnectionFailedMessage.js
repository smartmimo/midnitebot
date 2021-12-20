const {getAssetsVersion, getAppVersion, getBuildVersion} = require('../../../Libs/getMetadata.js');


async function ConnectionFailedMessage(payload){
	const {socket, data} = payload;
	const username = socket.account.username;
	if(data.reason == "INCOMPATIBBUILDLEVERSIONS"){
		sendToBrowser("LOG", {
			username,
			html: "<p class='warn'>Mise à jour necessaire, reconnexion..."
		})
		
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
			console.error(error);
		}
		
		socket.send("disconnecting", "LOGIN_ERROR");
	} else {
		sendToBrowser("LOG", {
			username,
			html: "<p class='error'>Erreur de connexion:" +data.reason+ "</p>"
		})
	}
}

module.exports = ConnectionFailedMessage;