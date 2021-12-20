const fs = require("fs");
const BSON = require("bson");

const sides = ["left", "right", "top", "bottom"];

function getMap(mapId) {
	return new Promise((resolve, reject) => {
		// console.log(fs.readdirSync('./'))
		// fs.readFile(`../../Assets/maps/${mapId}.bson`, (error, data) => {
		fs.readFile(`./src/Assets/maps/${mapId}.bson`, (error, data) => {
			if (error) {
				console.log(error)
				if (error.code == "ENOENT") {
					resolve({});
				} else {
					reject(error);
				}
			} else {
				// console.log(mapId)
				resolve(BSON.deserialize(data));
			}
		});
	});
}

function getRandomClosestMapChangeCells(pathfinderInstance, cells, cellId, mapSide, radius) {
	const mapChangeCells = getMapChangeCellIdsBySide(cells);
	const mapSideCells = mapChangeCells[mapSide].filter(function (cell) {
		const path = pathfinderInstance.getPath(cellId, cell.id, [], true, false)
		return path[path.length - 1] == cell.id;
	});
	
	
	if (mapSideCells.length > 0) {
		const mapSideCellsRadius = getClosestMapChangeCells(
			cellId,
			mapSideCells,
			radius
		);
		
		// console.log(mapSideCellsRadius)
		const randomCellIndex = Math.floor(
			Math.random() * mapSideCellsRadius.length
		);
		if(mapSideCellsRadius[randomCellIndex]) return mapSideCellsRadius[randomCellIndex];
		
		// console.log(mapSideCellsRadius[randomCellIndex])
		return mapSideCells[0].id
	}
	console.log("No cell to move to the", mapSide)
	return false;
}

function getMapChangeCellIdsBySide(cells) {
	const mapChangeCells = getMapChangeCells(cells);
	let mapChangeCellsBySide = {
		left: [],
		right: [],
		top: [],
		bottom: []
	};
	for (var i = 0, len = mapChangeCells.length; i < len; i++) {
		const cell = mapChangeCells[i];
		const cellSides = [ //script.js
			cells[cell.id].c & 56 && cell.id % 14 === 0, //left
			cells[cell.id].c & 131 && cell.id % 14 === 13, //right
			cells[cell.id].c & 224 && cell.id < 28, //top
			cells[cell.id].c & 14 && cell.id > 531 //bottom
		];

		for (let j = 0; j < 4; j++) {
			if (cellSides[j]) {
				const side = sides[j];
				
				mapChangeCellsBySide[side].push(cell);
				break;
			}
		}
	}
	return mapChangeCellsBySide;
}

function getMapChangeCells(cells) {
	let mapChangeCells = [];

	for (let i = 0; i < cells.length; i++) {
		if (cells[i].hasOwnProperty("c")) {
			mapChangeCells.push(getCellCoordinates(i));
		}
	}
	return mapChangeCells;
}

function getClosestMapChangeCells(currentCellId, cellList, radius) {
	if (!radius || radius < 1) {
		radius = 4; // Default radius of 4
	}
	let cellIds = cellList.map(cell => cell.id);
	
	let currentCellCoords = getCellCoordinates(currentCellId)
	let shortestCellId = cellList
		.map(cell => {
			return [
				Math.sqrt(Math.pow((currentCellCoords.x - cell.x), 2) +
					Math.pow((currentCellCoords.y - cell.y),2)),
				cell.id
			];
		})
		.sort((a, b) => a[0] - b[0])[0][1];
	// console.log(shortestCellId)
	let radiusCells = getCircleShapeCells(shortestCellId, radius).filter(cell =>
		cellIds.includes(cell)
	);
	return radiusCells;
}

function getCircleShapeCells(cellId, radius) {
	var cells = [];

	for (let x = -radius; x <= radius; x++) {
		for (let y = -radius; y <= radius; y++) {
			if (Math.abs(x) + Math.abs(y) <= radius) {
				let newCell =
					cellId +
					29 * Math.floor(x / 2) -
					27 * Math.floor(y / 2) +
					Math.abs((x + y) % 2) *
						((Math.floor(cellId / 14) % 2) +
							14 * (Math.abs(x % 2) - Math.abs(y % 2))) +
					(Math.abs(x * (x + y + 1)) % 2);

				if (
					newCell % 14 >= (cellId % 14) - radius / 2 &&
					newCell % 14 <= (cellId % 14) + radius / 2
				) {
					cells.push(newCell);
				}
			}
		}
	}
	return cells;
}

function getCellCoordinates(cellId) {
	const x = cellId % 14;
	let y = Math.floor(cellId / 28);
	const odd = Math.floor(cellId / 14) % 2 ? 1 : 0;
	return { x, y, odd, id: cellId };
}
module.exports = {
	getMap,
	getRandomClosestMapChangeCells,
	getMapChangeCellIdsBySide
};