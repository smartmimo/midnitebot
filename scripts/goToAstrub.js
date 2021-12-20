async function goastrub(){
	await talk("Maître Anemo")
	// await talk(888)
	await reply(0)
	await reply(0)
	await reply(0)
}

function* back(){
	yield useInteractiveElement(465376, "Se rendre à Incarnam")
}

var s;
function* start() {	
	yield log.info("Going to Astrub... ")
	
	s = new Date()

	// yield useInteractiveElement(465400, "Se rendre à Incarnam");
}

function* move(){
	return [
	  { map: '8,3', path: 'right' },
	  { map: '7,3', path: 'right' },
	  { map: '6,3', path: 'right' },
	  { map: '5,3', path: 'right' },
	  { map: '4,3', path: 'right' },
	  { map: '3,3', path: 'right' },
	  { map: '2,3', path: 'right' },
	  { map: '1,3', path: 'right' },
	  { map: '0,3', path: 'right' },
	  { map: '-1,3', path: 'right' },
	  { map: '-2,2', path: 'bottom' },
	  { map: '-3,1', path: 'right' },
	  { map: '-4,0', path: 'right' },
	  { map: '-5,-1', path: 'bottom' },
	  { map: '9,3', custom: goastrub },
	  { map: '4,-20', path: 'bottom' },
	  { map: '4,-21', path: 'bottom' },
	  { map: '4,-22', path: 'bottom' },
	  { map: '3,-21', path: 'right' },
	  { map: '2,-21', path: 'right' },
	  { map: '1,-21', path: 'right' },
	  { map: '3,-20', path: 'right' },
	  { map: '2,-20', path: 'right' },
	  { map: '3,-19', path: 'right' },
	  { map: '2,-19', path: 'right' },
	  { map: '1,-19', path: 'right' },
	  { map: '0,-19', path: 'right' },
	  { map: '7,-15', path: 'top' },
	  { map: '-1,-15', path: 'top' },
	  { map: '2,-16', path: 'right' },
	  { map: '1,-16', path: 'right' },
	  { map: '0,-16', path: 'right' },
	  { map: '-1,-16', path: 'right' },
	  { map: '-1,-17', path: 'bottom' },
	  { map: '3,-16', path: 'right' },
	  { map: '3,-22', path: 'right' },
	  { map: '2,-22', path: 'right' },
	  { map: '5,-21', path: 'left' },
	  { map: '6,-21', path: 'left' },
	  { map: '7,-21', path: 'left' },
	  { map: '5,-20', path: 'left' },
	  { map: '6,-20', path: 'left' },
	  // { map: '6,-20', custom: back },
	  { map: '5,-19', path: 'left' },
	  { map: '5,-17', path: 'left' },
	  { map: '6,-17', path: 'left' },
	  { map: '7,-17', path: 'left' },
	  { map: '5,-16', path: 'left' },
	  { map: '6,-16', path: 'left' },
	  { map: '7,-16', path: 'left' },
	  { map: '-1,-14', path: 'top' },
	  { map: '67371008', path: '465' }
	]
}
function stop() {
	log.info("Execution Time: "+ ((new Date() - s) / 1000) + "s");
}