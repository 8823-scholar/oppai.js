/*! oppai.js / @version:0.0.0 @author:dameleon <dameleon@gmail.com> @license:MIT */ 
;(function(global, undefined) {
var DEBUG = false;
var document = global.document;
var env = __getEnv(global.navigator.userAgent);
var events = {
        touchStart: env.isTouchDevice && "touchstart" || "mousedown",
        touchMove:  env.isTouchDevice && "touchmove"  || "mousemove",
        touchEnd:   env.isTouchDevice && "touchend"   || "mouseup"
};
var raf = global.requestAnimationFrame ||
          global.webkitRequestAnimationFrame ||
          global.mozRequestAnimationFrame ||
          global.oRequestAnimationFrame ||
          global.msRequestAnimationFrame ||
          (function(timing) { return function(cb) { global.setTimeout(cb, timing); } })(1000/60);
var defaultSetting = {
        dpr: 1,
        onload: null,
        onstart: null
};

/**
 * @param {String|HTMLCanvasElement} canvas
 * @param {String} imagePath
 * @param {Object} option
 * @param {Object} opp[]
 * @param {Array}  opp[].vertex     [x, y]
 * @param {Array}  opp[].round_coods [[x, y], [x, y], ...]
 */
function Oppai() {
    var that = this;
    var args = [].slice.call(arguments);
    var canvas = args.shift();
    var imgPath = args.shift();
    var option = args.shift();

    this.setting = _extend({}, defaultSetting, option);
    this.canvas = __getCanvas(canvas);
    this.ctx = this.canvas.getContext('2d');
    this.image = null;
    this.hooters = [];
    this._oppList = args;
    this._loadImage(imgPath, function() {
        that._init();
    });
}


//// static methods & properties
Oppai.getTouchInfoFromEvent = _getTouchInfo;
Oppai.extend = _extend;
Oppai.env = env;

function _getTouchInfo(event, name) {
    return env.isTouchDevice ? event.changedTouches[0][name] : event[name];
}

function _extend() {
    if (arguments.length < 2) {
        return arguments[0];
    }
    var deepTargetRe = /(object|array)/;
    var args = [].slice.call(arguments);
    var res = args.shift();
    var i = 0, arg;

    while ((arg = args[i])) {
        var j = 0;

        switch (typeof arg) {
            case 'array':
                for (var jz = arg.length; j < jz; j++) {
                    extend(j, res, arg);
                }
                break;
            case 'object':
                var donorKeys = Object.keys(arg);

                for (var key; key = donorKeys[j]; j++) {
                    extend(key, res, arg);
                }
                break;
        }
        i++;
    }

    return res;

    function extend(key, target, donor) {
        var val = donor[key];
        var targetVal = target[key];
        var donorValType = (val && typeof val) || '';
        var targetValType = (targetVal && typeof targetVal) || '';

        if (deepTargetRe.test(donorValType)) {
            if (targetValType !== donorValType) {
                target[key] = (donorValType === 'object') ? {} : [];
            }
            _extend(target[key], val);
        } else {
            target[key] = val;
        }
    }
}


//// instance methods
Oppai.prototype = {
    constructor: Oppai,
    update: _update,
    _init: _init,
    _loadImage: _loadImage
};

function _update() {
    var that = this;
    var hooters = this.hooters;

    for (var i = 0, breast; breast = hooters[i]; ++i) {
        breast.update();
    }
    raf(function() {
        that.update();
    });
}

function _init() {
    var oppList = this._oopList;
    var ctx = this.ctx;
    var image = this.image;

    for (var i = 0, opp; opp = oppList[i]; i++) {
        this.hooters.push(new Oppai.Breast(ctx, image, opp));
    }
    this.update();
}

function _loadImage(src, callback) {
    var that = this;
    var image = new Image();

    image.onload = function() {
        var img = that.image = document.createElement('canvas');

        img.width = image.naturalWidth;
        img.height = image.naturalHeight;
        if (that.option.dpr > 1) {
            var dpr = that.option.dpr;

            img.style.width = (img.width / dpr) + 'px';
            img.style.height = (img.height / dpr) + 'px';
        }
        img.getContext('2d').drawImage(image, 0, 0);
    };
    image.onerror = function() {
        throw new Error('cannot load image [src]: ' + src);
    };
    image.src = src;
}


//// private methods
function __getCanvas(canvas) {
    var element;

    if (typeof canvas === 'string') {
        element = document.querySelector(canvas);
        if (!element) {
            throw new Error('');
        }
    } else if (canvas && (canvas.tagName.toLowerCase() === 'canvas')) {
        element = canvas;
    } else {
        throw new Error('');
    }
    return element;
}

function __getEnv(ua) {
    var res = {};

    ua = ua.toLowerCase();
    res.isAndroid = /android/.test(ua);
    res.isIos = /ip(hone|od|ad)/.test(ua);
    res.isTouchDevice = 'ontouchstart' in global;
    res.versionString = null;
    res.version = [];

    // for smartphone
    if (res.isAndroid || res.isIos) {
        res.isChrome = /(chrome|crios)/.test(ua);
        res.isAndroidBrowser = !res.chrome && res.android && /applewebkit/.test(ua);
        res.isMobileSafari = !res.chrome && res.ios && /applewebkit/.test(ua);
        res.versionString =
            (res.androidBrowser || res.android && res.chrome) ? ua.match(/android\s(\S.*?)\;/) :
            (res.mobileSafari || res.ios && res.chrome) ? ua.match(/os\s(\S.*?)\s/) :
            null;
        res.versionString = res.versionString ?
            // iOS だったら、_ を . に直す
            (res.ios ? res.versionString[1].replace('_', '.') : res.versionString[1]) :
            null;
        if (res.versionString) {
            res.version = res.versionString.split('.');
        }
    }
    // IE様特別仕様
    else {
        res.isIE = /trident/.test(ua) || /msie/.test(ua);
        if (res.isIE) {
            if ((res.versionString = ua.match(/rv:([\d\.]+)/)) ||
                (res.versionString = ua.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/))) {
                    res.version = res.versionString.split('.');
            }
        }
    }
    if (res.version) {
        for (var i = 0, val; val = res.version[i]; i++) {
            res.version[i] = val|0;
        }
    }
    return res;
}

//// export
global.Oppai = Oppai;

})(this.self || global, void 0);

;(function(global, undefined) {

if (!global.Oppai) {
    throw new Error('Undefined objecct: "Oppai"');
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} image
 * @param {Object} opp
 * @param {Array}  opp.vertex     [x, y]
 * @param {Array}  opp.area_coods [[x, y], [x, y], ...]
 */
function Breast(ctx, image, opp) {
    var roundCoords = opp.roundCoords;
    var roundPoints;

    this.ctx = ctx;
    this.image = image;
    this.vertexPoint = new Point(opp.vertex[0], opp.vertex[1]);
    this.roundPoints = roundPoints = [];
    for (var i = 0, coord; coord = roundCoords[i]; i++) {
        roundPoints.push(new Point(coord[0], coord[1]));
    }
    this.draw();
}

Breast.prototype = {
    constructor: Breast,
    update: _update,
    draw: _draw,
    drawTriangle: _drawTriangle,
};

function _update() {

}

function _draw() {
    var that = this;
    var vertexPoint =  that.vertexPoint;
    var roundPoints = that.roundPoints;
    var rp, nextRp;
    var i = 0, j;

    for (; rp = roundPoints[i]; i++) {
        nextRp = roundPoints[i + 1] || roundPoints[0];
        that.drawTriangle(rp, nextRp, vertexPoint);
    }
}

function _drawTriangle(p0, p1, p2) {
    var ctx = this.ctx;
    var img = this.image;
    var imgWidth = img.width;
    var imgHeight = img.height;

    // 各ポイントが動いている現在の座標系
    var p0coord = p0.getCurrentXY();
    var p1coord = p1.getCurrentXY();
    var p2coord = p2.getCurrentXY();
    var p0x = p0coord.x;
    var p0y = p0coord.y;
    var p1x = p1coord.x;
    var p1y = p1coord.y;
    var p2x = p2coord.x;
    var p2y = p2coord.y;

    var ax = p1x - p0x;
    var ay = p1y - p0y;
    var bx = p2x - p0x;
    var by = p2y - p0y;

    // uv座標
    var uvAx = (p1.x - p0.x);
    var uvAy = (p1.y - p0.y);
    var uvBx = (p2.x - p0.x);
    var uvBy = (p2.y - p0.y);

    var m = new MatrixUtil(uvAx, uvAy, uvBx, uvBy);
    var mInvert = m.getInvert();

    if (!mInvert) {
        return;
    }
    var a = mInvert.a * uvAx + mInvert.b * uvBx;
    var b = mInvert.c * uvAx + mInvert.d * uvBx;
    var c = mInvert.a * uvAy + mInvert.b * uvBy;
    var d = mInvert.c * uvAy + mInvert.d * uvBy;

    // 描画
    with (ctx) {
        save();
        beginPath();
        moveTo(p0x, p0y);
        lineTo(p1x, p1y);
        lineTo(p2x, p2y);
        closePath();
        clip();
        transform(a, b, c, d,
            p0x - (a * p0.x + c * p0.y),
            p0y - (b * p0.x + d * p0.y));
        drawImage(img, 0, 0);
        restore();
    }
}

////
function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype = {
    constructor: Point,
    getCurrentXY: _getCurrentXY
};

function _getCurrentXY() {
    return {
        x: this.x,
        y: this.y
    };
}

function MatrixUtil(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
}

MatrixUtil.prototype.getInvert = function() {
    var det = this.a * this.d - this.b * this.c;

    if (det > -0.0001 && det < 0.0001) {
        return null;
    }
    return (new MatrixUtil(
        this.d / det,
        -this.b / det,
        -this.c / det,
        this.a / det
    ));
};

//// export
global.Oppai.Breast = Breast;

})(this.self || global, void 0);
