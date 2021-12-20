const channels = require("./ChatChannels.json");

const n = [];
for(const id in channels){
	n.push({
		id,
		nameId: channels[id].nameId,
		shortcut: channels[id].shortcut
	})
}

require("fs").writeFileSync("chat.json", JSON.stringify(n, null, 4));