function* learnJob(){
	yield log.info("Learning job...")
	yield talk(849);
	yield reply(0);
	yield reply(0);
	yield reply(0);
	yield leave();
}

function start(){
	log.info("slm")
}
function* move(){
	return [
		/*temple*/
		{ map: '-2,2', path: 'bottom' },
		{ map: '-3,1', path: 'right' },
		{ map: '-4,0', path: 'right' },
		{ map: '-5,-1', path: 'bottom' },
		
		{ map: '0,3', path: 'right' },
		{ map: '1,3', path: 'right' },
		{ map: '2,3', path: 'right' },
		{ map: '3,3', path: 'right' },
		{ map: '4,3', custom: !characterJobs().find(e=>e.name == "Paysan") ? learnJob : null, path: 'top' },
		
		{ map: '4,2', gather: true, path: 'top' },
		{ map: '4,1', gather: true, path: 'top' },
		{ map: '4,0', gather: true, path: 'top' },
		{ map: '4,-1', gather: true, path: 'right' },
		{ map: '5,-1', gather: true, path: 'bottom' },
		{ map: '5,0', gather: true, path: 'right' },
		{ map: '6,0', gather: true, path: 'bottom' },
		{ map: '6,1', gather: true, path: 'left' },
		{ map: '5,1', gather: true, path: 'bottom' },
		{ map: '5,2', gather: true, path: 'right' },
		{ map: '6,2', gather: true, path: 'right' },
		{ map: '7,2', gather: true, path: 'top' },
		{ map: '7,1', gather: true, path: 'right' },
		{ map: '8,1', gather: true, path: 'bottom' },
		{ map: '8,2', gather: true, path: 'bottom' },
		
		{ map: '8,3', path: 'left' },
		{ map: '7,3', path: 'left' },
		{ map: '6,3', path: 'left' },
		{ map: '5,3', path: 'left' },
		{ map: '4,3', path: 'left' },
	]
}

function* bank(){
	yield log.warn("Bank function")
	
	yield deleteItem("289")
	return this.move();
}