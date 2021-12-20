function ObjectsAddedMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;

// console.log(data)
	for(const object of data.object) socket.eventEmitter.emit("ObjectAddedMessage", {socket, data: {object}})
	
}

module.exports = ObjectsAddedMessage;