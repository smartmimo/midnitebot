const util = require("./util");

(async()=>{
	const data = await util.getMap(88080664);

	// console.log(data)
	console.log(util.getRandomClosestMapChangeCells(data.cells, 437, "bottom"))

})()