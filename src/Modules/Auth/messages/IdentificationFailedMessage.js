"use strict";

var logger = require("../../../Libs/Logger.js");


const reasons = {
	10: 'Compte non activé.',
	5: 'Maintenance'
}
function IdentificationFailedMessage(payload) {
  const { socket, data } = payload;
  const username = socket.account.username;
  
  logger.error(new Error(`Unable to identify [ ${socket.account.username} ] | reason: ${reasons[data.reason] ? reasons[data.reason] : data.reason}`));
  sendToBrowser("LOG", {username, html: `<p class='error'>Erreur de connexion: ${reasons[data.reason] ? reasons[data.reason] : data.reason}.</p>`})
  
  socket.send("disconnecting", "LOGIN_ERROR");
}

module.exports = IdentificationFailedMessage;