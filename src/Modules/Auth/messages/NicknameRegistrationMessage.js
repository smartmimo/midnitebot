const words = require("../../../Assets/words.json");
const nouns = require("../../../Assets//nouns.json");
const verbs = require("../../../Assets//verbs.json");
const logger = require("../../../Libs/Logger.js");

const numbers = "1234567890";

function getRandomNumbers(min, max) {
	let string = "";
	const digitCount = Math.round(Math.random() * (max - min) + min);

	for (let i = 0; i < digitCount; i++) {
		const index = Math.round(Math.random() * 9);
		string += numbers[index];
	}
	return string;
}

function generateNickname() {
	var string = "";
	const containMiddleNumbers = Math.floor(Math.random() * 20) > 15;
	const containNumbers = Math.floor(Math.random() * 20) > 8;
	const combination = [
		words[Math.floor(Math.random() * words.length)],
		nouns[Math.floor(Math.random() * nouns.length)],
		verbs[Math.floor(Math.random() * verbs.length)],
	];
	const j = Math.floor(Math.random() * combination.length);
	string += combination[j];
	combination.splice(j, 1);

	if (containMiddleNumbers) {
		string += getRandomNumbers(1, Math.floor(Math.random() * 2) + 1);
	}
	string += combination[Math.floor(Math.random() * combination.length)];

	return containNumbers ? string : string + getRandomNumbers(1, 4);
}


/******************************/

const nicknameError = {
	1: "ALREADY IN USE",
	2: "SAME AS LOGIN",
	3: "TOO SIMILAR TO LOGIN",
	4: "INVALID NICKNAME",
	99: "UNKNOWN NICKNAME ERROR"
};

function NicknameRegistrationMessage(payload) {
	const socket = payload.socket;
	const username = socket.account.username;
	let nickname = generateNickname();
	
	sendToBrowser("LOG", {
		username,
		html: `<p class='info'>Génération du pseudo...</p>`
	})
	
	socket.eventEmitter.on("NicknameRefusedMessage", payload =>{
		sendToBrowser("LOG", {
			username,
			html: `<p class='error'>Erreur lors de la génération du pseudo: ${nicknameError[payload.data.reason]}, nouvelle tentative...</p>`
		})
		logger.warn(`[${username}] NICKNAME ERROR | nicknameError[payload.data.reason]`);
		
		nickname = generateNickname();

		setTimeout(() => {
			socket.sendMessage("NicknameChoiceRequestMessage", {
				nickname
			});
		}, 2000);
	});
	
	socket.eventEmitter.once("NicknameAcceptedMessage", () => {
		socket.eventEmitter.off("NicknameRefusedMessage");
		logger.info(`[${username}] NICKNAME SET | ${nickname}`);
		sendToBrowser("LOG", {
			username,
			html: `<p class='success'>Pseudo confirmé: <span style='color:white;'>${nickname}</span>, reconnexion...</p>`
		})
		socket.send("disconnecting", "CLIENT_CLOSING");
	});
	
	socket.sendMessage("NicknameChoiceRequestMessage", {
		nickname
	});
}

module.exports = NicknameRegistrationMessage;