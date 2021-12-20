function constructMapPoints() {
	var mapPointToCellId = {}
	for (var cellId = 0; cellId < 560; cellId++) {
		var coord = getMapPointFromCellId(cellId);
		mapPointToCellId[coord.x + '_' + coord.y] = cellId;
	}
	return (mapPointToCellId)
}
const mapPointToCellId = constructMapPoints();

/**
 ** Returns the closest fighter to a given cell from given fighters
 * @param {int} x
 * @param {object} fighters json
**/
function getClosestFighterOfCell(cellId, fighters) {
	var closest = null;
	var closestDistance = 999;
	
	for (const i in fighters) {
		const fighter = fighters[i];
		const fighterCellId = fighter.disposition.cellId;
			
		var distance = getCellDistance(cellId, fighterCellId);
			if (!closest || distance < closestDistance || (distance == closestDistance && fighter.stats.lifePoints < closest.stats.lifePoints)) { //if closer than previous clotest (or is weaker in case they have same distance)
				closest = fighter;
				closestDistance = distance;
			}
		}
		return closest;
	}
	
/**
 ** Returns distance between two cells
 * @param {int} id of cell
 * @param {int} id of cell
 **/
function getCellDistance(e, t) {
	var i = getMapPointFromCellId(e),
		n = getMapPointFromCellId(t),
		o = Math.abs(i.x - n.x) + Math.abs(i.y - n.y);
	return o
}


/**
 * Returns map point from given cell
 * @param {int} id of cell
**/
function getMapPointFromCellId(e) {
	var t = e % 14 - ~~(e / 28),
		i = t + 19,
		n = t + ~~(e / 14);
	return {
		x: i,
		y: n
	}
}

/**
** Returns cell id from given map point
 * @param {int} x
 * @param {int} y
**/
function getCellIdFromMapPoint(x, y) {
	var cellId = mapPointToCellId[x + '_' + y];
	return cellId;
}

function PathNode(cellId, mp, ap, tackleMp, tackleAp, distance) {
	this.cellId = cellId;
	this.availableMp = mp;
	this.availableAp = ap;
	this.tackleMp = tackleMp;
	this.tackleAp = tackleAp;
	this.distance = distance;
}

function MoveNode(tackleCost, from, reachable) {
	this.ap = tackleCost.ap;
	this.mp = tackleCost.mp;
	this.from = from;
	this.reachable = reachable;
	this.path = null;
}

/**
	 ** Returns array of all cells next to given cell
	 * @param {int} id of cell
	 * @param {bool} whether to count in diagonal cells
	 **/
function getNeighbourCells(cellId, allowDiagonal) {
	allowDiagonal = allowDiagonal || false;
	var coord = getMapPointFromCellId(cellId);
	var x = coord.x;
	var y = coord.y;
	var neighbours = [];
	if (allowDiagonal) {
		neighbours.push(getCellIdFromMapPoint(x + 1, y + 1));
	}
	neighbours.push(getCellIdFromMapPoint(x, y + 1));
	if (allowDiagonal) {
		neighbours.push(getCellIdFromMapPoint(x - 1, y + 1));
	}
	neighbours.push(getCellIdFromMapPoint(x - 1, y));
	if (allowDiagonal) {
		neighbours.push(getCellIdFromMapPoint(x - 1, y - 1));
	}
	neighbours.push(getCellIdFromMapPoint(x, y - 1));
	if (allowDiagonal) {
		neighbours.push(getCellIdFromMapPoint(x + 1, y - 1));
	}
	neighbours.push(getCellIdFromMapPoint(x + 1, y));
	return neighbours;
}


/** Returns the range of a ring shaped area.
 *  cell in result range are ordered by distance to the center, ascending.
 *
 * @param {number} x - x coordinate of center
 * @param {number} y - y coordinate of center
 * @param {number} radiusMin - radius of inner limit of ring
 * @param {number} radiusMax - radius of outter limit of ring
 *
 * @return {Array} range - an array of point coordinate.
 */
function shapeRing(e, t, i, n) {
	var o = [];
	0 === i && o.push([e, t, 0]);
	for (var a = i || 1; a <= n; a++)
		for (var s = 0; s < a; s++) {
			var r = a - s;
			o.push([e + s, t - r, a]), o.push([e + r, t + s, a]), o.push([e - s, t + r, a]), o.push([e - r, t - s, a])
		}
	return o
}

/** Returns the range of a cross shaped area.
 *  cell in result range are ordered by distance to the center, ascending.
 *
 * @param {number} x - x coordinate of center
 * @param {number} y - y coordinate of center
 * @param {number} radiusMin - inner radius of area
 * @param {number} radiusMax - outter radius of area
 *
 * @return {number[]} range - an array of point coordinate.
 */
function shapeCross(x, y, radiusMin, radiusMax) {
	var range = [];
	if (radiusMin === 0) {
		range.push([x, y, 0]);
	}
	for (var i = radiusMin || 1; i <= radiusMax; i++) {
		range.push([x - i, y, i]);
		range.push([x + i, y, i]);
		range.push([x, y - i, i]);
		range.push([x, y + i, i]);
	}
	return range;
}

/** Returns the range of a star shaped area. */
function shapeStar(x, y, radiusMin, radiusMax) {
	var range = [];
	if (radiusMin === 0) {
		range.push([x, y, 0]);
	}
	for (var i = radiusMin || 1; i <= radiusMax; i++) {
		range.push([x - i, y - i, i]);
		range.push([x - i, y + i, i]);
		range.push([x + i, y - i, i]);
		range.push([x + i, y + i, i]);
	}
	return range;
}

/** Combinaison of shapeCross and shapeStar */
function shapeCrossAndStar(x, y, radiusMin, radiusMax) {
	var range = [];
	if (radiusMin === 0) {
		range.push([x, y, 0]);
	}
	for (var i = radiusMin || 1; i <= radiusMax; i++) {
		// cross
		range.push([x - i, y, i]);
		range.push([x + i, y, i]);
		range.push([x, y - i, i]);
		range.push([x, y + i, i]);
		// star
		range.push([x - i, y - i, i]);
		range.push([x - i, y + i, i]);
		range.push([x + i, y - i, i]);
		range.push([x + i, y + i, i]);
	}
	return range;
}

/** Returns the range of a square shaped area. */
function shapeSquare(x, y, radiusMin, radiusMax) {
	var range = [];
	if (radiusMin === 0) {
		range.push([x, y, 0]);
	}
	for (var radius = radiusMin || 1; radius <= radiusMax; radius++) {
		// segment middles
		range.push([x - radius, y, radius]);
		range.push([x + radius, y, radius]);
		range.push([x, y - radius, radius]);
		range.push([x, y + radius, radius]);
		// segment corners
		range.push([x - radius, y - radius, radius]);
		range.push([x - radius, y + radius, radius]);
		range.push([x + radius, y - radius, radius]);
		range.push([x + radius, y + radius, radius]);
		// segment remaining
		for (var i = 1; i < radius; i++) {
			range.push([x + radius, y + i, radius]);
			range.push([x + radius, y - i, radius]);
			range.push([x - radius, y + i, radius]);
			range.push([x - radius, y - i, radius]);
			range.push([x + i, y + radius, radius]);
			range.push([x - i, y + radius, radius]);
			range.push([x + i, y - radius, radius]);
			range.push([x - i, y - radius, radius]);
		}
	}
	return range;
}

/** Return the range of a cone shaped area (effect type 'V') */
function shapeCone(x, y, radiusMin, radiusMax, dirX, dirY) {
	var range = [];
	for (var radius = radiusMin; radius <= radiusMax; radius++) {
		var xx = x + radius * dirX;
		var yy = y + radius * dirY;
		range.push([xx, yy, radius]);
		for (var i = 1; i <= radius; i++) {
			range.push([xx + i * dirY, yy - i * dirX, radius]);
			range.push([xx - i * dirY, yy + i * dirX, radius]);
		}
	}
	return range;
}

/** Return the range of a halfcircle shaped area (effect type 'U') */
function shapeHalfcircle(x, y, radiusMin, radiusMax, dirX, dirY) {
	var range = [];
	if (radiusMin === 0) {
		range.push([x, y, 0]);
	}
	for (var radius = radiusMin || 1; radius <= radiusMax; radius++) {
		var xx = x - radius * dirX;
		var yy = y - radius * dirY;
		range.push([xx + radius * dirY, yy - radius * dirX, radius]);
		range.push([xx - radius * dirY, yy + radius * dirX, radius]);
	}
	return range;
}

/** Returns the range of a four cones shaped area (effect type 'W')
 *  The shape is basicaly a square without the diagonals and central point.
 */
function shapeCones(x, y, radiusMin, radiusMax) {
	var range = [];
	for (var radius = radiusMin || 1; radius <= radiusMax; radius++) {
		// segment middles
		range.push([x - radius, y, radius]);
		range.push([x + radius, y, radius]);
		range.push([x, y - radius, radius]);
		range.push([x, y + radius, radius]);
		// segment remaining
		for (var i = 1; i < radius; i++) {
			range.push([x + radius, y + i, radius]);
			range.push([x + radius, y - i, radius]);	
			range.push([x - radius, y + i, radius]);
			range.push([x - radius, y - i, radius]);
			range.push([x + i, y + radius, radius]);
			range.push([x - i, y + radius, radius]);
			range.push([x + i, y - radius, radius]);
			range.push([x - i, y - radius, radius]);
		}
	}
	return range;
}

/** Returns the range of a inline segment shaped area. */
function shapeLine(x, y, radiusMin, radiusMax, dirX, dirY) {
	var range = [];
	for (var i = radiusMin; i <= radiusMax; i++) {
		range.push([x + dirX * i, y + dirY * i, i]);
	}
	return range;
}

/** Return the range of a circle perimeter area (effect type 'O')
 *  The function is based on shapeRing, replacing the radiusMin by radiusMax.
 */
function shapeCirclePerimeter(x, y, radiusMin, radiusMax) {
	return shapeRing(x, y, radiusMax, radiusMax);
}

/** Return the range of a inverted circle area (effect type 'I')
 *  The function is based on shapeRing, going from radiusMax to Infinity.
 *
 *  TODO: Algorithm could be optimized. This one add a lot of invalid cells.
 */
function shapeInvertedCircle(x, y, radiusMin, radiusMax) {
	return shapeRing(x, y, radiusMax, INFINITE_RANGE);
}

/** Return the range of a perpendicular segment shaped area (effect type '-' and 'T') */
function shapePerpendicular(x, y, radiusMin, radiusMax, dirX, dirY) {
	var range = [];
	if (radiusMin === 0) {
		range.push([x, y, 0]);
	}
	for (var i = radiusMin || 1; i <= radiusMax; i++) {
		range.push([x + dirY * i, y - dirX * i, i]);
		range.push([x - dirY * i, y + dirX * i, i]);
	}
	return range;
}


var shaperMap = {
	'P': null, // Point: displayed as one cell.
	'A': null, // Whole map: displayed as one cell.
	'D': null, // Chessboard mask: not implemented in original game.
	'X': {
		fn: shapeCross,
		hasDirection: false,
		withoutCenter: false
	},
	'L': {
		fn: shapeLine,
		hasDirection: true,
		withoutCenter: false
	},
	'T': {
		fn: shapePerpendicular,
		hasDirection: true,
		withoutCenter: false
	},
	'C': {
		fn: shapeRing,
		hasDirection: false,
		withoutCenter: false
	},
	'O': {
		fn: shapeCirclePerimeter,
		hasDirection: false,
		withoutCenter: false
	},
	'+': {
		fn: shapeStar,
		hasDirection: false,
		withoutCenter: false
	},
	'G': {
		fn: shapeSquare,
		hasDirection: false,
		withoutCenter: false
	},
	'V': {
		fn: shapeCone,
		hasDirection: true,
		withoutCenter: false
	},
	'W': {
		fn: shapeCones,
		hasDirection: false,
		withoutCenter: false
	},
	'/': {
		fn: shapeLine,
		hasDirection: true,
		withoutCenter: false
	},
	'-': {
		fn: shapePerpendicular,
		hasDirection: true,
		withoutCenter: false
	},
	'U': {
		fn: shapeHalfcircle,
		hasDirection: true,
		withoutCenter: false
	},
	'Q': {
		fn: shapeCross,
		hasDirection: false,
		withoutCenter: true
	},
	'#': {
		fn: shapeStar,
		hasDirection: false,
		withoutCenter: true
	},
	'*': {
		fn: shapeCrossAndStar,
		hasDirection: false,
		withoutCenter: false
	},
	'I': {
		fn: shapeInvertedCircle,
		hasDirection: false,
		withoutCenter: false
	}
};

function n(e) {
	var t = e.substr(0, 1),
		i = e.length > 1 ? e.substr(1)
		.split(",") : [],
		o = 0,
		a = 0,
		s = 0,
		r = 0;
	switch (i.length) {
		case 0:
			if ("X" === t) return n("X1");
			if ("U" === t) return n("U1");
			if ("T" === t) return n("T1");
			if ("C" === t) return n("C1");
			if ("G" === t) return n("G1");
			if ("+" === t) return n("+1");
			break;
		case 1:
			o = parseInt(i[0], 10);
			break;
		case 2:
			o = parseInt(i[0], 10), EFFECT_SHAPES[t].hasMinSize ? a = parseInt(i[1], 10) : s = parseInt(i[1], 10);
			break;
		case 3:
			o = parseInt(i[0], 10), EFFECT_SHAPES[t].hasMinSize ? (a = parseInt(i[1], 10), s = parseInt(i[2], 10)) : (s = parseInt(i[1], 10), r = parseInt(i[2], 10));
			break;
		case 4:
			o = parseInt(i[0], 10), a = parseInt(i[1], 10), s = parseInt(i[2], 10), r = parseInt(i[3], 10)
	}
	return {
		zoneShape: t,
		zoneSize: o,
		zoneMinSize: a,
		zoneEfficiencyPercent: s,
		zoneMaxEfficiency: r
	}
}

var EFFECT_SHAPES = {
	// cross - getText('ui.spellarea.cross')
	X: {
		code: 88,
		desc: 'ui.spellarea.cross',
		alt: '',
		hasMinSize: true
	},
	// inline - getText('ui.spellarea.line')
	L: {
		code: 76,
		desc: 'ui.spellarea.line',
		alt: '',
		hasMinSize: false
	},
	// perpendicular line - getText('ui.spellarea.tarea')
	T: {
		code: 84,
		desc: 'ui.spellarea.tarea',
		alt: '',
		hasMinSize: false
	},
	// point (circle size 0)
	P: {
		code: 80,
		desc: '',
		alt: '',
		hasMinSize: false
	},
	// circle with chessboard pattern - getText('ui.spellarea.chessboard')
	D: {
		code: 68,
		desc: 'ui.spellarea.chessboard',
		alt: '',
		hasMinSize: false
	},
	// circle - getText('ui.spellarea.circle')
	C: {
		code: 67,
		desc: 'ui.spellarea.circle',
		alt: '',
		hasMinSize: true
	},
	// ring (circle perimeter) - getText('ui.spellarea.ring')
	O: {
		code: 79,
		desc: 'ui.spellarea.ring',
		alt: '',
		hasMinSize: false
	},
	// cross without central point - getText('ui.spellarea.crossVoid')
	Q: {
		code: 81,
		desc: 'ui.spellarea.crossVoid',
		alt: '',
		hasMinSize: true
	},
	// directional cone - getText('ui.spellarea.cone')
	V: {
		code: 86,
		desc: 'ui.spellarea.cone',
		alt: '',
		hasMinSize: false
	},
	// 4 cones without diagonals
	W: {
		code: 87,
		desc: '',
		alt: '',
		hasMinSize: false
	},
	// 4 diagonals
	'+': {
		code: 43,
		desc: '',
		alt: 'plus',
		hasMinSize: true
	},
	// diagonals without the central point
	'#': {
		code: 35,
		desc: '',
		alt: 'sharp',
		hasMinSize: true
	},
	// lines and diagonals
	'*': {
		code: 42,
		desc: '',
		alt: 'star',
		hasMinSize: false
	},
	// aligned diagonals
	'/': {
		code: 47,
		desc: '',
		alt: 'slash',
		hasMinSize: false
	},
	// perpendicular diagonal - getText('ui.spellarea.diagonal')
	'-': {
		code: 45,
		desc: 'ui.spellarea.diagonal',
		alt: 'minus',
		hasMinSize: false
	},
	// diamond - getText('ui.spellarea.square')
	G: {
		code: 71,
		desc: 'ui.spellarea.square',
		alt: '',
		hasMinSize: false
	},
	// inverted circle (infinite if min range > 0)
	I: {
		code: 73,
		desc: '',
		alt: '',
		hasMinSize: false
	},
	// halfcircle - getText('ui.spellarea.halfcircle')
	U: {
		code: 85,
		desc: 'ui.spellarea.halfcircle',
		alt: '',
		hasMinSize: false
	},
	// whole map, all players - getText('ui.spellarea.everyone')
};

transformStates = (function(e, t) {
    function i(e, t, i, n, o, a) {
    this.sx = e, this.sy = t, this.r = i, this.g = n, this.b = o, this.a = a
    }
    t.empty = new i(.1, .1, .5, .5, .5, 0), t.fullRed = new i(.78, .78, .8, .12, .08, .8), t.fullGreen = new i(.78, .78, 0, 1, .22, .7), t.fullBlue = new i(.78, .78, 0, .51, .91, .8), t.walkable = new i(.9, .9, 1, .92, 0, .5), t.unwalkable = new i(.9, .9, .9, 0, 0, .8), t.walkableLast = new i(.9, .9, 1, 1, 0, .8), t.inSight = new i(.78, .78, 0, 0, 1, .5), t.outSight = new i(.78, .78, .6, .6, 1, .5), t.areaOfEffect = new i(.78, .78, 1, 0, 0, .9), t.inSightEnemyTurn = new i(.78, .78, .3, .3, .3, .8), t.outSightEnemyTurn = new i(.78, .78, .5, .5, .5, .7), t.areaOfEffectEnemyTurn = new i(.78, .78, 1, 1, 1, 1), t.blueTeamStart = new i(1, 1, 0, 0, 1, .5), t.blueTeamEnd = new i(.95, 1, .1, .4, .8, .45), t.redTeamStart = new i(1, 1, 1, 0, 0, .5), t.redTeamEnd = new i(.95, 1, .8, .4, .1, .45), t.walkArea = new i(1, 1, 0, .9, .02, .3), t.walkAreaRequiresAP = new i(1, 1, 0, .43, .4, .4), t.walkAreaRestricted = new i(1, 1, 1, 0, 0, .4), t.enemyWalkArea = new i(1, 1, .1, .9, .032, .6), t.enemyWalkAreaRequiresAP = new i(1, 1, .1, .435, .4, .6), t.enemyWalkAreaRestricted = new i(.9, .9, 1, 0, 0, .6), t.TransformState = i
})

function getSpellRange(cellsData, source, spell) {
	var coords = getMapPointFromCellId(source);
	var rangeCoords;
	if (spell.castInLine && spell.castInDiagonal) {
		rangeCoords = shapeCross(coords.x, coords.y, spell.minRange, spell.range)
		.concat(shapeStar(coords.x, coords.y, spell.minRange, spell.range));
	} else if (spell.castInLine) {
		rangeCoords = shapeCross(coords.x, coords.y, spell.minRange, spell.range);
	} else if (spell.castInDiagonal) {
		rangeCoords = shapeStar(coords.x, coords.y, spell.minRange, spell.range);
	} else {
		rangeCoords = shapeRing(coords.x, coords.y, spell.minRange, spell.range);
	}
	return rangeCoords;
};

getLine = function(e, t, i, n) {
    var o = "x",
        s = "y",
        a = [],
        r = {
        x: e + .5,
        y: t + .5
        },
        l = {
        x: i + .5,
        y: n + .5
        },
        c = {
        x: 0,
        y: 0
        },
        u = 0;
    if (Math.abs(r.x - l.x) === Math.abs(r.y - l.y)) {
        u = Math.abs(r.x - l.x), c.x = l.x > r.x ? 1 : -1, c.y = l.y > r.y ? 1 : -1;
        for (var d = 0; d < u; d++) a.push({
        x: Math.floor(r.x + c.x),
        y: Math.floor(r.y + c.y)
        }), r.x += c.x, r.y += c.y
    } else {
        var h = s,
        p = o;
        Math.abs(r.x - l.x) > Math.abs(r.y - l.y) && (h = o, p = s), u = Math.abs(r[h] - l[h]), c[h] = l[h] >= r[h] ? 1 : -1, c[p] = l[p] > r[p] ? Math.abs(r[p] - l[p]) / u : -Math.abs(r[p] - l[p]) / u;
        for (var m = 0; m < u; m++) {
        var f = [],
            g = Math.round(1e4 * r[p] + 5e3 * c[p]) / 1e4,
            _ = Math.round(1e4 * r[p] + 15e3 * c[p]) / 1e4;
        Math.floor(g) === Math.floor(_) ? (f = [Math.floor(r[p] + c[p])], g === f[0] && _ < f[0] && (f = [Math.ceil(r[p] + c[p])]), _ === f[0] && g < f[0] && (f = [Math.ceil(r[p] + c[p])])) : Math.ceil(g) === Math.ceil(_) ? (f = [Math.ceil(r[p] + c[p])], g === f[0] && _ < f[0] && (f = [Math.floor(r[p] + c[p])]), _ === f[0] && g < f[0] && (f = [Math.floor(r[p] + c[p])])) : f = [Math.floor(g), Math.floor(_)];
        for (var v in f) h === o ? a.push({
            x: Math.floor(r.x + c.x),
            y: f[v]
        }) : a.push({
            x: f[v],
            y: Math.floor(r.y + c.y)
        });
        r.x += c.x, r.y += c.y
        }
    }
    return a
}
	
function testLos(mapCells, a, cellId, visibleActors) {
	var mp = getMapPointFromCellId(cellId);
	var finalArray = [];
	for (var i = 0; i < a.length; i++) {
		var r = a[i];
		var u = getMapPointFromCellId(r);
		var p = getLine(mp.x, mp.y, u.x, u.y);
		var g = p.length;
		var m = false;
		for (var f = 0; f < g; f++) {
			var _ = getCellIdFromMapPoint(p[f].x, p[f].y),
				v = mapCells[_];
			if (visibleActors[_] && f < g - 1 || 2 !== (2 & v.l)) {
				m = true;
				break
			}
		}
		if (!m) {
			finalArray.push(r);
		}
	}
	return finalArray;
}

module.exports = {
	getCellDistance,
	getClosestFighterOfCell,
	PathNode,
	MoveNode,
	getNeighbourCells,
	transformStates,
	n,
	getMapPointFromCellId,
	shaperMap,
	getCellIdFromMapPoint,
	getSpellRange,
	testLos
};