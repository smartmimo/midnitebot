/* prettier-ignore */
/* eslint-disable */

function init(t = params) {
    function r(e) {
        if (n[e]){
			return n[e].exports;
		}
        var i = n[e] = {
            exports: {},
            id: e,
            loaded: !1
        };
        return t[e].call(i.exports, i, i.exports, r), i.loaded = !0, i.exports
    }
    var n = {};
	
    return r.m = t, r.c = n, r.p = "", r(0)
}


const params = [function(t, r, n) {
    function e(t, r) {
        this.i = t, this.j = r, this.floor = -1, this.zone = -1, this.speed = 1, this.weight = 0, this.candidateRef = null
    }

    function i(t, r) {
        void 0 !== t && 1 & t.l ? (r.floor = t.f || 0, r.zone = t.z || 0, r.speed = 1 + (t.s || 0) / 10, r.zone !== m && (g = !1)) : (r.floor = -1, r.zone = -1)
    }

    function a(t, r, n, e, i) {
        this.i = t, this.j = r, this.w = n, this.d = e, this.path = i
    }

    function o(t, r) {
        return t.floor === r.floor || t.zone === r.zone && (g || 0 !== t.zone || Math.abs(t.floor - r.floor) <= c)
    }

    function h(t, r, n, e) {
        return o(t, r) && (o(t, n) || o(t, e))
    }

    function l(t, r, n, e, i, o) {
        var h = t.i,
            l = t.j,
            s = Math.sqrt((n - h) * (n - h) + (e - l) * (e - l));
        if (r = r / t.speed + t.weight, null === t.candidateRef) {
            var u = new a(h, l, o.w + r, s, o);
            i.push(u), t.candidateRef = u
        } else {
            var f = t.candidateRef.w,
                d = o.w + r;
            d < f && (t.candidateRef.w = d, t.candidateRef.path = o)
        }
    }

    function s(t, r, n, e, i) {
        var a = t.i,
            s = t.j,
            u = p[a][s],
            f = p[a - 1][s],
            d = p[a][s - 1],
            c = p[a][s + 1],
            v = p[a + 1][s];
        o(u, f) && l(f, 1, r, n, e, t), o(u, v) && l(v, 1, r, n, e, t), o(u, d) && l(d, 1, r, n, e, t), o(u, c) && l(c, 1, r, n, e, t);
        var y = p[a - 1][s - 1],
            x = p[a - 1][s + 1],
            g = p[a + 1][s - 1],
            m = p[a + 1][s + 1],
            b = Math.sqrt(2);
        i && (h(u, y, f, d) && l(y, b, r, n, e, t), h(u, g, v, d) && l(g, b, r, n, e, t), h(u, x, f, c) && l(x, b, r, n, e, t), h(u, m, v, c) && l(m, b, r, n, e, t))
    }
    for (var u = n(1), f = u.getMapPointFromCellId, d = u.getCellIdFromMapPoint, c = 11.825, p = [], v = 0; v < 35; v += 1) {
        for (var y = [], x = 0; x < 36; x += 1) y[x] = new e(v, x);
        p[v] = y
    }
    var g, m;
    r.fillPathGrid = function(t) {
        m = t.cells[0].z || 0, g = !0;
        for (var r = 0; r < 35; r += 1)
            for (var n = p[r], e = 0; e < 36; e += 1) {
                var a = d(r - 1, e - 1),
                    o = n[e];
                i(t.cells[a], o)
            }
    }, r.updateCellPath = function(t, r) {
        var n = u.getMapPointFromCellId(t);
        i(r, p[n.x + 1][n.y + 1])
    }, r.getPath = function(t, r, n, e, i) {
        var o, h;
        e = void 0 === e || !!e;
        var l = f(t),
            u = f(r),
            c = l.x + 1,
            v = l.y + 1,
            y = p[c][v];
        if (-1 === y.zone) {
            for (var x = null, g = 1 / 0, m = 1 / 0, b = -1; b <= 1; b += 1)
                for (var M = -1; M <= 1; M += 1)
                    if (0 !== b || 0 !== M) {
                        var w = p[c + b][v + M];
                        if (-1 !== w.zone) {
                            var j = Math.abs(w.f - y.f),
                                z = Math.abs(b) + Math.abs(M);
                            (null === x || j < m || j <= m && z < g) && (x = w, g = z, m = j)
                        }
                    } return null !== x ? [t, d(x.i - 1, x.j - 1)] : (console.error(new Error("[pathFinder.getPath] Player is stuck in " + c + "/" + v)), [t])
        }
        var C, P, I = u.x + 1,
            A = u.y + 1;
        for (P in n) C = f(P), p[C.x + 1][C.y + 1].weight += 10;
        for (var R = [], F = [], q = new a(c, v, 0, Math.sqrt((c - I) * (c - I) + (v - A) * (v - A)), null), _ = null, k = q; q.i !== I || q.j !== A;) {
            s(q, I, A, R, e);
            var D = R.length;
            if (0 === D) {
                q = k;
                break
            }
            var O = 1 / 0,
                S = 0;
            for (o = 0; o < D; o += 1)(h = R[o]).w + h.d < O && (q = h, O = h.w + h.d, S = o);
            if (F.push(q), R.splice(S, 1), 0 === q.d || i && q.d < 1.5) {
                if (null === _ || q.w < _.w) {
                    _ = q, k = q;
                    var G = [];
                    for (o = 0; o < R.length; o += 1)(h = R[o]).w + h.d < _.w ? G.push(h) : p[h.i][h.j].candidateRef = null;
                    R = G
                }
            } else q.d < k.d && (k = q)
        }
        for (o = 0; o < R.length; o += 1) h = R[o], p[h.i][h.j].candidateRef = null;
        for (var N = 0; N < F.length; N += 1) q = F[N], p[q.i][q.j].candidateRef = null;
        for (P in n) C = f(P), p[C.x + 1][C.y + 1].weight -= 10;
        for (var E = []; null !== k;) E.unshift(d(k.i - 1, k.j - 1)), k = k.path;
        return E
    }, r.getAccessibleCells = function(t, r) {
        r += 1;
        var n = p[t += 1][r],
            e = p[t - 1][r],
            i = p[t][r - 1],
            a = p[t][r + 1],
            h = p[t + 1][r],
            l = [];
        return o(n, e) && l.push({
            i: e.i - 1,
            j: e.j - 1
        }), o(n, h) && l.push({
            i: h.i - 1,
            j: h.j - 1
        }), o(n, i) && l.push({
            i: i.i - 1,
            j: i.j - 1
        }), o(n, a) && l.push({
            i: a.i - 1,
            j: a.j - 1
        }), l
    }, r.compressPath = function(t) {
        for (var r, n, e = [], i = t[0], a = -1, o = 0; o < t.length; o++) {
            var h, l = t[o],
                s = f(l);
            (h = 0 === o ? -1 : s.y === n ? s.x > r ? 7 : 3 : s.x === r ? s.y > n ? 1 : 5 : s.x > r ? s.y > n ? 0 : 6 : s.y > n ? 2 : 4) !== a && (e.push(i + (h << 12)), a = h), i = l, r = s.x, n = s.y
        }
        return e.push(i + (a << 12)), e
    }, r.normalizePath = function(t) {
        return function(t) {
            if (!Array.isArray(t) || t.length < 2) return !1;
            for (var r = f(t[0]), n = 1, e = t.length; n < e; n += 1) {
                var i = t[n],
                    a = f(i);
                if (Math.abs(r.x - a.x) > 1) return !1;
                if (Math.abs(r.y - a.y) > 1) return !1;
                r = a
            }
            return !0
        }(t) ? t : function(t) {
            if (!Array.isArray(t)) return [];
            if (t.length < 2) return t;
            var r = [];
            r.push(t[0]);
            for (var n = f(t[0]), e = 1, i = t.length; e < i; e += 1) {
                var a, o, h = t[e],
                    l = f(h),
                    s = Math.abs(l.x - n.x),
                    u = Math.abs(l.y - n.y);
                if (0 === s || 0 === u) {
                    if (s > 1)
                        for (a = l.x > n.x ? 1 : -1, n.x += a; n.x !== l.x;) r.push(d(n.x, n.y)), n.x += a;
                    if (u > 1)
                        for (o = l.y > n.y ? 1 : -1, n.y += o; n.y !== l.y;) r.push(d(n.x, n.y)), n.y += o
                } else if (s === u)
                    for (a = l.x > n.x ? 1 : -1, o = l.y > n.y ? 1 : -1, n.x += a, n.y += o; n.y !== l.y;) r.push(d(n.x, n.y)), n.x += a, n.y += o;
                n = l, r.push(h)
            }
            return r
        }(t)
    }, r.logPath = function(t) {
        t = t || [];
        var r, n, e = [];
        for (r = 0; r < 33; r += 1)
            for (e.push([]), n = 0; n < 34; n += 1) void 0 === d(r, n) ? e[r][n] = "    " : e[r][n] = "[  ]";
        for (var i = 0, a = t.length; i < a; i += 1) {
            var o = t[i],
                h = f(o),
                l = i < 10 ? "0" : "";
            e[h.x][h.y] = "[" + l + i + "]"
        }
        var s = "";
        for (n = 0; n < 34; n += 1) {
            for (r = 0; r < 33; r += 1) s += e[r][n];
            s += "\n"
        }
        return s
    }, r.getPathDuration = n(2).getPathDuration, r.cellCoord = n(3).cellCoord
}, function(t, r, n) {
    function e(t) {
        var r = t % 14 - ~~(t / 28);
        return {
            x: r + 19,
            y: r + ~~(t / 14)
        }
    }

    function i(t, r) {
        return p[t + "_" + r]
    }

    function a(t, r) {
        r = r || !1;
        var n = e(t),
            a = n.x,
            o = n.y,
            h = [];
        return r && h.push(i(a + 1, o + 1)), h.push(i(a, o + 1)), r && h.push(i(a - 1, o + 1)), h.push(i(a - 1, o)), r && h.push(i(a - 1, o - 1)), h.push(i(a, o - 1)), r && h.push(i(a + 1, o - 1)), h.push(i(a + 1, o)), h
    }
    var o = 86,
        h = 53 - o,
        l = -6.5,
        s = 19.225,
        u = Math.sqrt(2),
        f = u / 2,
        d = u / o,
        c = u / 43;
    r.getCoordinateSceneFromGrid = function(t) {
        var r = t.x - s,
            n = t.y;
        return {
            x: (f * r + f * n) / d + o / 2 + h,
            y: (f * n - f * r) / c + l
        }
    }, r.getMapPointFromCellId = e;
    var p = {};
    (function() {
        for (var t = 0; t < 560; t++) {
            var r = e(t);
            p[r.x + "_" + r.y] = t
        }
    })(), Object.freeze(p), r.getCellIdFromMapPoint = i, r.getNeighbourCells = a, r.areCellsNeighbours = function(t, r, n) {
        return -1 !== a(t, n).indexOf(r)
    }, r.getOrientation = function(t, r, n) {
        var i, a = e(t),
            o = e(r),
            h = Math.atan2(a.y - o.y, o.x - a.x);
        return i = n ? [3, 2, 2, 1, 1, 0, 0, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3][h = ~~(Math.floor(8 * h / Math.PI) + 8)] : [3, 1, 1, 7, 7, 5, 5, 3, 3][h = ~~(Math.floor(4 * h / Math.PI) + 4)], i
    }, r.getDistance = function(t, r) {
        return t = e(t), r = e(r), Math.abs(t.x - r.x) + Math.abs(t.y - r.y)
    }
}, function(t, r, n) {
    function e(t, r, n, e, i, a) {
        this.c = t, this.x = r, this.y = n, this.d = e, this.a = i, this.m = a
    }
    var i = [0, 1, 2, 1, 0, 5, 6, 5],
        a = {
            mounted: {
                linear: 135,
                horizontal: 200,
                vertical: 120,
                symbolId: "AnimCourse"
            },
            parable: {
                linear: 400,
                horizontal: 500,
                vertical: 450,
                symbolId: "FX"
            },
            running: {
                linear: 170,
                horizontal: 255,
                vertical: 150,
                symbolId: "AnimCourse"
            },
            walking: {
                linear: 480,
                horizontal: 510,
                vertical: 425,
                symbolId: "AnimMarche"
            },
            slide: {
                linear: 57,
                horizontal: 85,
                vertical: 50,
                symbolId: "AnimStatique"
            }
        },
        o = function(t, r) {
            return {
                id: t + "_" + i[r],
                base: t,
                direction: r
            }
        };
    r.getPathDuration = function(t, r) {
        if (t.length <= 1) return 0;
        var n, i, h, l;
        this.path = [], this.step = 0, l = this.isRiding ? a.mounted : t.length > 3 ? a.running : a.walking;
        for (var s, u = r || null, f = 0; f < t.length; f++) {
            var d = t[f],
                c = 0;
            this.isFightMode ? c = 0 : u && u[d] && u[d].f && (c = u[d].f);
            var p, v = this.cellCoord[d];
            0 === f ? s = 1 : v.y === h ? (p = l.horizontal, s = v.x > i ? 0 : 4) : v.x === i ? (p = l.vertical, s = v.y > h ? 2 : 6) : (p = l.linear, s = v.x > i ? v.y > h ? 1 : 7 : v.y > h ? 3 : 5);
            var y = o(l.symbolId, s);
            f > 0 && (n.d = s, n.a = y, n.m = p), this.path.push(new e(d, v.x, v.y - c, s, y, p)), n = this.path[this.path.length - 1], i = v.x, h = v.y
        }
        var x, g, m = {},
            b = o("AnimStatique", s),
            M = o("AnimStatique_to_" + this.path[0].a.base, this.path[0].a.direction),
            w = o(l.symbolId + "_to_" + b.base, s);
        return m[M.id] && (x = this.path[0], g = 0, this.path.unshift(new e(x.c, x.x, x.y, x.d, M, g))), m[w.id] && (g = 0, (x = this.path[this.path.length - 1]).a = w, x.m = g, this.path.push(new e(x.c, x.x, x.y, x.d, b, x.m))), this.path[this.path.length - 1].a = b, this.path.map(t => t.m).reduce((t, r) => t + r)
    }
}, function(t, r, n) {
    function e(t) {
        var r = t % 14,
            n = Math.floor(t / 14);
        return {
            x: (r += n % 2 * .5) * i,
            y: .5 * n * a
        }
    }
    var i = 86,
        a = 43;
    t.exports.getCellCoord = e;
    var o = [];
    t.exports.cellCoord = function() {
        for (var t = 0; t < 560; t += 1) o.push(e(t));
        return Object.freeze(o), o
    }()
}]


module.exports = init;