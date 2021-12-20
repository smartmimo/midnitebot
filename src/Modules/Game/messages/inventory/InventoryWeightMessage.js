function InventoryWeightMessage(payload) {
	const { socket, data } = payload;
	const username = socket.account.username;
	

	accounts[username]["inventory"]["weight"] = {weight: data.weight, maxWeight: data.weightMax}

	
	sendToBrowser("WEIGHT_UPDATE", {
		username,
		// items: accounts[username]["inventory"]["items"],
		weight: accounts[username]["inventory"].weight.weight,
		maxWeight: accounts[username]["inventory"].weight.maxWeight
	})
}

module.exports = InventoryWeightMessage;