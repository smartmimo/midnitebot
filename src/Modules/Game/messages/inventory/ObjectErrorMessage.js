const ObjectErrorEnum = {
	CANNOT_DESTROY: 6,
	CANNOT_DROP: 4,
	CANNOT_DROP_NO_PLACE: 5,
	CANNOT_EQUIP_HERE: 10,
	CANNOT_EQUIP_TWICE: 2,
	CANNOT_UNEQUIP: 9,
	CRITERIONS: 11,
	INVENTORY_FULL: 1,
	LEVEL_TOO_LOW: 7,
	LIVING_OBJECT_REFUSED_FOOD: 8,
	MIMICRY_OBJECT_ERROR: 12,
	NOT_TRADABLE: 3
}

function ObjectErrorMessage(payload){
	const {socket, data} = payload;
	const username = socket.account.username;
	
	var text;
	switch (data.reason) {
		case ObjectErrorEnum.INVENTORY_FULL:
			text = 'Votre inventaire est saturé.'
			break;
		case ObjectErrorEnum.CANNOT_EQUIP_TWICE:
			text = "L'object ne peut pas être équipé 2 fois."
			break;
		case ObjectErrorEnum.CANNOT_DROP:
			text = "Impossible de jeter cet objet."
			break;
		case ObjectErrorEnum.CANNOT_DROP_NO_PLACE:
			text = "Impossible de jeter cet objet: espace insuffisant."
			break;
		case ObjectErrorEnum.CANNOT_DESTROY:
			text = "Impossible de détruire cet objet."
			break;
		case ObjectErrorEnum.LEVEL_TOO_LOW:
			text = "Votre niveau est trop bas pour équiper cet objet."
			break;
		case ObjectErrorEnum.LIVING_OBJECT_REFUSED_FOOD:
			text = "Living object refused food."
			break;
		default:
			break;
		}
			
	sendToBrowser("LOG", {
		username,
		html: `<p class='error'>ObjectErrorMessage: ${text || data.reason}</p>`
	})
		
}

module.exports = ObjectErrorMessage;