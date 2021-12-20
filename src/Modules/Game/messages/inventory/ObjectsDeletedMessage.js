function ObjectsDeletedMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	
	console.log(data)
	for(const objectUID of data.objectUID) socket.eventEmitter.emit("ObjectDeletedMessage", {socket, data: {objectUID}})
	
	
}

module.exports = ObjectsDeletedMessage;