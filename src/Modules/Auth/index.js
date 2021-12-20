"use strict";
const HelloConnectMessage = require("./messages/HelloConnectMessage");

const IdentificationSuccessMessage = require("./messages/IdentificationSuccessMessage");

const ServersListMessage = require("./messages/ServersListMessage");

const SelectedServerDataMessage = require("./messages/SelectedServerDataMessage");

const IdentificationFailedMessage = require("./messages/IdentificationFailedMessage");

const IdentificationFailedBannedMessage = require("./messages/IdentificationFailedBannedMessage");

const serverDisconnecting = require("./messages/serverDisconnecting");

const ServerStatusUpdateMessage = require("./messages/ServerStatusUpdateMessage");

const LoginQueueStatusMessage = require("./messages/LoginQueueStatusMessage");

const NicknameRegistrationMessage = require("./messages/NicknameRegistrationMessage");
const ConnectionFailedMessage = require("./messages/ConnectionFailedMessage");

module.exports = [
	HelloConnectMessage, 
	IdentificationSuccessMessage, 
	ServersListMessage, 
	SelectedServerDataMessage, 
	IdentificationFailedMessage, 
	IdentificationFailedBannedMessage, 
	serverDisconnecting, 
	ServerStatusUpdateMessage, 
	LoginQueueStatusMessage, 
	NicknameRegistrationMessage,
	ConnectionFailedMessage
];

