FORBIDDEN_MONSTERS = [3502];
REGENERATE_ITEMS = [10792];
AUTO_DELETE = [14687];
var s;

function* start(){
	s = new Date();	
}

function stop() {
	log.info("Execution Time: "+ ((new Date() - s) / 1000) + "s");
}

function* move(){
	return [
	  { map: '0,3', path: 'right', fight: true },
	  { map: '1,3', path: 'top', fight: true },
	  { map: '1,2', path: 'left', fight: true },
	  { map: '0,2', path: 'bottom', fight: true },
	  { map: '8,3', path: 'left' },
	  { map: '7,3', path: 'left' },
	  { map: '6,3', path: 'left' },
	  { map: '5,3', path: 'left' },
	  { map: '4,3', path: 'left' },
	  { map: '3,3', path: 'left' },
	  { map: '2,3', path: 'left' },
	  { map: '-1,3', path: 'left' },
	  { map: '-2,2', path: 'bottom' },
	  { map: '-3,1', path: 'right' },
	  { map: '-4,0', path: 'right' },
	  { map: '-5,-1', path: 'bottom' },
	  { map: '6,6', path: 'top' },
	  { map: '6,5', path: 'top' },
	  { map: '6,4', path: 'top' },
	  { map: '6,3', path: 'left' },
	]
}

function* bank(){
	return [];
}

function* phoenix(){
	log.info("zab")
	return [
		 { map: '6,6', phoenix: true }
	];
}