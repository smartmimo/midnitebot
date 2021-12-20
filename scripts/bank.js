function* move(){
	log.info("slm");
	return [];
}

function* bank(){
	return [
		{map: currentMapId(), bank: true}
	];
}