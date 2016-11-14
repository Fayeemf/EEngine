var EE = {};
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = EE;
}
else {
  window.EE = EE;
}

EE.Guid = function () {
};

EE.Guid.prototype.get = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

EE.MathUtils = {};

EE.MathUtils.contains = function (a, b) {
  return (a.x < b.x && a.y < b.y &&
  a.x + a.width > b.x &&
  a.y + a.height > b.y);
};

EE.MathUtils.intersects = function (a, b) {
  return !(b.x > (a.x + a.width) ||
  (b.x + b.width) < a.x ||
  b.y > (a.y + a.height) ||
  (b.y + b.height) < a.y);
};
EE.Timer = function (game, delay, callback, repeat, interval) {
  this.delay = (delay >= 1 ? delay : 0);
  this.callback = callback;
  this.repeat = repeat || false;
  this.interval = interval || this.delay;
  this.stopped = false;
  this.game = game;
  this.type = EE.EntityType.UPDATABLE;

  this._next_tick = new Date();
  this._next_tick.setSeconds(this._next_tick.getSeconds() + (delay / 1000));
};

EE.Timer.prototype.start = function () {
  this.game.addEntity(this);
};

EE.Timer.prototype.update = function () {
  if (this.stopped) {
    return;
  }
  var curr_date = new Date();
  if (curr_date >= this._next_tick) {
    (this.callback.bind(this))();
    if (this.repeat) {
      this._next_tick = curr_date;
      this._next_tick.setSeconds(this._next_tick.getSeconds() + (this.interval / 1000));
    } else {
      this.stop();
    }
  }
};

EE.Timer.prototype.stop = function () {
  this.stopped = true;
  this.game.removeEntity(this);
};
EE.Utils = {};

EE.Utils.tryCall = function (thisarg, callable) {
  if (typeof callable === "function") {
    // Ignoring the two first arguments (this and callable)
    var params = Array.prototype.slice.call(arguments);
    params.shift();
    params.shift();
    callable.apply(thisarg, params);
  }
};
function parseConfig(xml, config) {
  var attrs = {};
  for (var i = 0; i < config.length; i++) {
    var attr = config[i];
    var elem = xml.getAttribute(attr);
    if (typeof elem != "undefined") {
      attrs[attr] = elem;
    }
  }
  return attrs;
}

EE.TiledMap = function (game, src, scale) {
  this.game = game;
  this.src = src;
  this.scale = scale;
  this.layers = [];

  this.conf = ["version", "orientation", "renderorder", "width", "height",
    "tilewidth", "tileheight", "hexsidelength", "staggeraxis", "staggerindex",
    "backgroundcolor", "nextobjectid"];
  this.attrs = [];
  this.tilesets = [];
  this.bounds = null;
  this.properties = [];
  this.xml = null;
};

EE.TiledMap.prototype.init = function () {
  this.game._loader.add(new Promise(function (resolve, reject) {
    var xhr;
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
      xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xhr.onload = function () {
      this._loaded(xhr, resolve);
    }.bind(this);
    xhr.open("GET", this.src);
    xhr.send();
  }.bind(this)));
};

EE.TiledMap.prototype.onLoad = function (callback) {
  if (typeof callback != "function") {
    throw "onLoad callback must be a function, " + typeof callback + " provided";
  }
  this._loadcb = callback;
};

EE.TiledMap.prototype._loaded = function (xhr, resolve) {
  var resp = xhr.responseText;
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(resp, "text/xml");
  this.xml = xmlDoc;
  this.attrs = parseConfig(xmlDoc.getElementsByTagName("map")[0], this.conf);
  var tilesetsXml = xmlDoc.getElementsByTagName("tileset");
  for (var i = 0; i < tilesetsXml.length; i++) {
    this.tilesets.push(new EE.TiledMapTileset(this, tilesetsXml[i]));
  }

  var layers = xmlDoc.getElementsByTagName("layer");
  var promises = [];

  for (var i = 0; i < layers.length; i++) {
    var data = layers[i].getElementsByTagName("data")[0].textContent;
    var layer = new EE.TiledMapLayer(this, this.tilesets[0], layers[i], data);
    this.layers.push(layer);
    promises.push(layer.load());
  }

  var x = parseInt(this.layers[0].attrs.x || 0);
  var y = parseInt(this.layers[0].attrs.y || 0);
  var w = parseInt(this.layers[0].attrs.width);
  var h = parseInt(this.layers[0].attrs.height);

  var tW = parseInt(this.attrs.tilewidth);
  var tH = parseInt(this.attrs.tileheight);

  this.bounds = new EE.Rect(x, y, w * tW * this.scale, h * tH * this.scale);
  this._getProperties();
  Promise.all(promises).then(function () {
    resolve("success");
    if (this._loadcb) {
      this._loadcb(resp);
    }
  }.bind(this));
};

EE.TiledMap.prototype._getFromTag = function (xmlDoc, tagname, attr, toInt) {
  var val = xmlDoc.getElementsByTagName(tagname)[0].getAttribute(attr);
  if (toInt) {
    return parseInt(val);
  }
  return val;
};

EE.TiledMap.prototype.getLayer = function (name) {
  return (this.layers.filter(function (elem) {
    return elem.attrs.name === name
  }.bind(this)))[0];
};

EE.TiledMap.prototype.render = function () {
  for (var i = 0; i < this.layers.length; i++) {
    this.layers[i].render();
  }
};

EE.TiledMap.prototype._getProperties = function () {
  var tiles = this.xml.getElementsByTagName("tile");
  for (var i = 0; i < tiles.length; i++) {
    var properties = tiles[i].getElementsByTagName("property");
    for (var j = 0; j < properties.length; j++) {
      var prop_name = properties[j].getAttribute("name");
      var prop_value = properties[j].getAttribute("value");
      this.properties.push({id: tiles[i].getAttribute("id"), name: prop_name, value: prop_value});
    }
  }
};
EE.TiledMapImage = function (map, tileset, xmlNode) {
  this.map = map;
  this.xml = xmlNode;
  this.tileset = tileset;

  this.conf = ["format", "id", "source", "trans", "width", "height"];
  this.attrs = parseConfig(this.xml, this.conf);
};
EE.TiledMapLayer = function (map, tileset, xmlNode) {
  this.map = map;
  this.xml = xmlNode;
  this.tileset = tileset;
  this.loaded = false;

  this.conf = ["name", "x", "y", "width", "height", "opacity", "visible",
    "offsetx", "offsety"];
  this.attrs = parseConfig(this.xml, this.conf);

  var tmpData = xmlNode.getElementsByTagName("data")[0].textContent;
  this.data = [];
  this.tiles = [];

  var tmpArr = tmpData.split(',');
  for (var j = 0; j < tmpArr.length; j++) {
    this.data.push(parseInt(tmpArr[j]));
  }
  this.id = this.attrs.name || new EE.Guid().get();
  this._img = null;
  this._collisionEnabled = false;
};

EE.TiledMapLayer.prototype.load = function () {
  return new Promise(function (resolve, reject) {
    try {
      var img = new Image();
      img.src = this.tileset.image.attrs.source;
      img.onload = function () {
        this.map.game.loadTexture(this.id, this.tileset.image.attrs.source);

        var tileWidth = parseInt(this.tileset.attrs.tilewidth);
        var tileHeight = parseInt(this.tileset.attrs.tileheight);

        var imgWidth = parseInt(this.tileset.image.attrs.width);
        var width = parseInt(this.attrs.width);

        for (var i = 0; i < this.data.length; i++) {
          if (this.data[i] === 0) continue;
          var tileAmountWidth = imgWidth / tileWidth;

          var y = Math.ceil(this.data[i] / tileAmountWidth) - 1;
          var x = this.data[i] - (tileAmountWidth * y) - 1;
          var tile = new EE.TiledMapTile(this, img, Math.ceil(x * tileWidth),
            Math.ceil(y * tileHeight), tileWidth, tileHeight,
            (Math.floor(i % width) * tileWidth * this.map.scale),
            (Math.floor(i / width) * tileHeight * this.map.scale),
            tileWidth * this.map.scale, tileHeight * this.map.scale, this.data[i]);
          this.tiles.push(tile);
        }
        this.loaded = true;
        this._create_tile();
        resolve("layer loaded");
      }.bind(this)
    } catch (e) {
      reject("Error during loading of the layer");
    }
  }.bind(this));
};

EE.TiledMapLayer.prototype._create_tile = function () {
  var canvas = document.createElement("canvas");
  canvas.width = this.map.bounds.width;
  canvas.height = this.map.bounds.height;

  var img_ids = [];
  var ctx = canvas.getContext("2d");
  for (var i = 0; i < this.tiles.length; i++) {
    var tile = this.tiles[i];
    ctx.drawImage(tile.img, tile.sx, tile.sy, tile.sw, tile.sh, tile.bounds.x, tile.bounds.y, tile.bounds.width, tile.bounds.height);
  }

  this._img = new Image();
  this._img.setAttribute('crossOrigin', 'anonymous');
  this._img.src = canvas.toDataURL("image/png");
};

EE.TiledMapLayer.prototype.enableCollision = function () {
  if (!this.loaded) {
    throw "Can't call enableCollision before the layer is loaded";
  }
  if (this._collisionEnabled) {
    return;
  }
  this.map.game.addEntities(this.tiles);
};

EE.TiledMapLayer.prototype.render = function (debug) {
  if (this.loaded && (this.attrs.visible != "false")) {
    var transformed = this.map.game._camera.toScreen(
      {
        x: 0,
        y: 0,
        width: this._img.width,
        height: this._img.height
      });
    this.map.game.getRendererSurface().drawImage(this._img, transformed.x, transformed.y, transformed.width, transformed.height);
  }
  if (debug) {
    for (var i = 0; i < this.tiles.length; i++) {
      this.tiles[i].render();
    }
  }
};

EE.TiledMapTile = function (layer, img, sx, sy, sw, sh, x, y, w, h, id) {
  this.layer = layer;
  this.img = img;
  this.sx = sx;
  this.sy = sy;
  this.sw = sw;
  this.sh = sh;
  this.bounds = new EE.Rect(x, y, w, h);
  this.id = id;
  this.type = EE.EntityType.COLLIDABLE;
};

EE.TiledMapTile.prototype.render = function (dt) {
  var transformed = this.layer.map.game._camera.toScreen(
    {
      x: this.bounds.x,
      y: this.bounds.y,
      width: this.bounds.width,
      height: this.bounds.height
    });
  this.layer.map.game.getRendererSurface().drawRectangle(transformed.x, transformed.y, transformed.width, transformed.height);
};

EE.TiledMapTile.prototype.getProperty = function (prop_name) {
  return this.layer.map.properties[prop_name];
};

EE.TiledMapTileset = function (map, xmlNode) {
  this.map = map;
  this.xml = xmlNode;

  this.conf = ["firstgid", "source", "name", "tilewidth", "tileheight",
    "spacing", "margin", "tilecount", "columns"];
  this.attrs = parseConfig(this.xml, this.conf);
  this.image = new EE.TiledMapImage(this.map, this, this.xml.getElementsByTagName("image")[0]);
};
EE.Box = function (game, bounds, color) {
  this.game = game;
  this.bounds = bounds;
  this.color = color;
  this.type = EE.EntityType.RENDERABLE;
};

EE.Box.prototype.render = function () {
  var transformed = this.game._camera.toScreen(this.bounds);
  this.game.getRendererSurface().drawRectangle(transformed.x, transformed.y, transformed.width, transformed.height, this.color);
};

EE.Box.prototype.setColor = function (color) {
  // TODO : Input validation for color
  this.color = color;
};
EE.Cursor = function(canvas) {
  this._canvas = canvas;
  this.x = 0;
  this.y = 0;
  this._canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
};

EE.Cursor.prototype._onMouseMove = function(event) {
  var rect = this._canvas.getBoundingClientRect();
  this.x = event.clientX - rect.left;
  this.y = event.clientY - rect.top;
};
EE.KeyboardController = function (game) {
  this.game = game;
  this._keys = [];

  window.addEventListener("keydown", this._onKeyDown.bind(this));
  window.addEventListener("keyup", this._onKeyUp.bind(this));
};

EE.KeyboardController.prototype._onKeyDown = function (event) {
  var key = this._findKey(event.keyCode);
  if (typeof key !== "undefined") {
    key.down = true;
  } else {
    this._keys.push(new EE.KeyInfo(event.keyCode, true));
  }
};

EE.KeyboardController.prototype._findKey = function (keycode) {
  var key = this._keys.filter(function (keyinfo) {
    return keyinfo.keycode == keycode;
  });
  return key[0];
};

EE.KeyboardController.prototype._onKeyUp = function (event) {
  var key = this._findKey(event.keyCode);
  if (typeof key !== "undefined") {
    key.down = false;
  }
};

EE.KeyboardController.prototype.pressed = function (keyCode) {
  var key = this._findKey(keyCode);
  return typeof key !== "undefined" && key.down;
};

EE.KeyInfo = function (keycode, down) {
  this.keycode = keycode;
  this.down = down;
};
EE.Keys = {
  A: "A".charCodeAt(0),

  B: "B".charCodeAt(0),

  C: "C".charCodeAt(0),

  D: "D".charCodeAt(0),

  E: "E".charCodeAt(0),

  F: "F".charCodeAt(0),

  G: "G".charCodeAt(0),

  H: "H".charCodeAt(0),

  I: "I".charCodeAt(0),

  J: "J".charCodeAt(0),

  K: "K".charCodeAt(0),

  L: "L".charCodeAt(0),

  M: "M".charCodeAt(0),

  N: "N".charCodeAt(0),

  O: "O".charCodeAt(0),

  P: "P".charCodeAt(0),

  Q: "Q".charCodeAt(0),

  R: "R".charCodeAt(0),

  S: "S".charCodeAt(0),

  T: "T".charCodeAt(0),

  U: "U".charCodeAt(0),

  V: "V".charCodeAt(0),

  W: "W".charCodeAt(0),

  X: "X".charCodeAt(0),

  Y: "Y".charCodeAt(0),

  Z: "Z".charCodeAt(0),

  ZERO: "0".charCodeAt(0),

  ONE: "1".charCodeAt(0),

  TWO: "2".charCodeAt(0),

  THREE: "3".charCodeAt(0),

  FOUR: "4".charCodeAt(0),

  FIVE: "5".charCodeAt(0),

  SIX: "6".charCodeAt(0),

  SEVEN: "7".charCodeAt(0),

  EIGHT: "8".charCodeAt(0),

  NINE: "9".charCodeAt(0),

  NUMPAD_0: 96,

  NUMPAD_1: 97,

  NUMPAD_2: 98,

  NUMPAD_3: 99,

  NUMPAD_4: 100,

  NUMPAD_5: 101,

  NUMPAD_6: 102,

  NUMPAD_7: 103,

  NUMPAD_8: 104,

  NUMPAD_9: 105,

  NUMPAD_MULTIPLY: 106,

  NUMPAD_ADD: 107,

  NUMPAD_ENTER: 108,

  NUMPAD_SUBTRACT: 109,

  NUMPAD_DECIMAL: 110,

  NUMPAD_DIVIDE: 111,

  F1: 112,

  F2: 113,

  F3: 114,

  F4: 115,

  F5: 116,

  F6: 117,

  F7: 118,

  F8: 119,

  F9: 120,

  F10: 121,

  F11: 122,

  F12: 123,

  F13: 124,

  F14: 125,

  F15: 126,

  COLON: 186,

  EQUALS: 187,

  COMMA: 188,

  UNDERSCORE: 189,

  PERIOD: 190,

  QUESTION_MARK: 191,

  TILDE: 192,

  OPEN_BRACKET: 219,

  BACKWARD_SLASH: 220,

  CLOSED_BRACKET: 221,

  QUOTES: 222,

  BACKSPACE: 8,

  TAB: 9,

  CLEAR: 12,

  ENTER: 13,

  SHIFT: 16,

  CONTROL: 17,

  ALT: 18,

  CAPS_LOCK: 20,

  ESC: 27,

  SPACEBAR: 32,

  PAGE_UP: 33,

  PAGE_DOWN: 34,

  END: 35,

  HOME: 36,

  LEFT: 37,

  UP: 38,

  RIGHT: 39,

  DOWN: 40,

  PLUS: 43,

  MINUS: 44,

  INSERT: 45,

  DELETE: 46,

  HELP: 47,

  NUM_LOCK: 144
};
EE.CanvasRenderSurface = function (canvas) {
  this._canvas = canvas;
  this._context = canvas.getContext("2d");
  this._cursor = new EE.Cursor(this._canvas);
  this.default_stroke_color = "black";
  this.default_fill_color = "black";
};

EE.CanvasRenderSurface.prototype.getDrawingContext = function() {
  return this._context;
};

EE.CanvasRenderSurface.prototype.getSurfaceWidth = function() {
  return this._canvas.width;
};

EE.CanvasRenderSurface.prototype.getSurfaceHeight = function() {
  return this._canvas.height;
};

EE.CanvasRenderSurface.prototype.setBackgroundColor = function(color) {
  this._canvas.style.backgroundColor = color;
  return this._canvas;
};

EE.CanvasRenderSurface.prototype.addEventListener = function(args) {
  this._canvas.addEventListener.apply(this._canvas, arguments);
  return this._canvas;
};

EE.CanvasRenderSurface.prototype.beginDraw = function() {
  this._context.clearRect(0, 0, this.getSurfaceWidth(), this.getSurfaceHeight());
  this._context.beginPath();
};

EE.CanvasRenderSurface.prototype.endDraw = function() {
  this._context.closePath();
};

EE.CanvasRenderSurface.prototype.getCursor = function() {
  return this._cursor;
};

EE.CanvasRenderSurface.prototype.drawImage = function(src, x, y, width, height) {
  this._context.drawImage(src, x, y, width, height);
};

EE.CanvasRenderSurface.prototype.drawImagePart = function(src,sx,sy,swidth,sheight,x,y,width,height) {
  this._context.drawImage(src, sx,sy,swidth,sheight,x,y,width,height);
};

EE.CanvasRenderSurface.prototype.drawRectangle = function(x, y, width, height, color) {
  this._context.save();
  this._context.strokeStyle = color || this.default_stroke_color;
  this._context.strokeRect(x, y, width, height);
  this._context.restore();
};

EE.CanvasRenderSurface.prototype.fillRectangle = function(x, y, width, height, color) {
  this._context.save();
  this._context.fillStyle = color || this.default_fill_color;
  this._context.fillRect(x, y, width, height);
  this._context.restore();
};

EE.CanvasRenderSurface.prototype.drawString = function(txt, x, y) {
  // TODO : implementation
};
EE.NullRenderSurface = function (width, height) {
  this.width = width;
  this.height = height;
  this._context = null;
};

EE.NullRenderSurface.prototype.getDrawingContext = function() {
  return this._context;
};

EE.NullRenderSurface.prototype.getSurfaceWidth = function() {
  return this.width;
};

EE.NullRenderSurface.prototype.getSurfaceHeight = function() {
  return this.height;
};

EE.NullRenderSurface.prototype.setBackgroundColor = function(color) {
  return this;
};

EE.NullRenderSurface.prototype.addEventListener = function(args) {
  return this;
};

EE.NullRenderSurface.prototype.beginDraw = function() {
};

EE.NullRenderSurface.prototype.endDraw = function() {
};
EE.Sprite = function (game, text_id, x, y, width, height, z_index) {
  this.game = game;
  this.text_id = text_id;
  this.bounds = new EE.Rect(x, y, width, height);
  this.velocity = new EE.Vector2(0, 0);
  this._colliders = [];
  this.z_index = z_index || 0;
  this.visible = true;
  this.clickable = true;
  this.components = [];
  this.type = EE.EntityType.ENTITY;
};

EE.Sprite.prototype.render = function () {
  for (var i = 0; i < this.components.length; i++) {
    EE.Utils.tryCall(this, this.components[i].component.render);
  }
  if (!this.visible) {
    return;
  }
  var texture = this.game.getTexture(this.text_id);
  var width = this.bounds.width || texture.width;
  var height = this.bounds.height || texture.height;
  var transformed = this.game._camera.toScreen({x: this.bounds.x, y: this.bounds.y, width: width, height: height});
  this.game.getRendererSurface().drawImage(texture, transformed.x, transformed.y, transformed.width, transformed.height);
};

EE.Sprite.prototype.update = function (dt) {
  var nextX = this.bounds.x + this.velocity.x;
  var nextY = this.bounds.y + this.velocity.y;

  if (this._checkCollision(nextX, nextY)) {
    this.velocity.x = 0;
    this.velocity.y = 0;
  } else {
    this.moveTo(nextX, nextY);
  }

  for (var i = 0; i < this._colliders.length; i++) {
    if (this.intersects(this._colliders[i].candidate)) {
      if (!this._colliders[i].hit) {
        this._colliders[i].callback();
      }
      this._colliders[i].hit = true;
    } else {
      this._colliders[i].hit = false;
    }
  }
  for (var i = 0; i < this.components.length; i++) {
    EE.Utils.tryCall(this, this.components[i].component.update, dt);
  }
};

EE.Sprite.prototype.addComponent = function (name, component) {
  if (typeof name !== "string") {
    throw "Name parameter must be a string";
  }
  if (typeof this.getComponent(name) !== "undefined") {
    throw "Duplicate component name : " + name;
  }
  instance = typeof component == "function" ? new (Function.prototype.bind.apply(component, arguments)) : component;
  this.components.push({"name": name, "component": instance});
  EE.Utils.tryCall(this, instance.init);
  return instance;
};

EE.Sprite.prototype.getComponent = function (name) {
  var result = this.components.filter(function (item) {
    return item.name == name;
  });
  return result[0];
};

EE.Sprite.prototype.moveTo = function (x, y) {
  if (this._checkCollision(x, y)) {
    return;
  }
  this.bounds.x = x;
  this.bounds.y = y;
};

EE.Sprite.prototype.moveOffset = function (x, y) {
  var nX = this.bounds.x + (x || 0);
  var nY = this.bounds.y + (y || 0);
  if (this._checkCollision(nX, nY)) {
    return;
  }
  this.bounds.x = nX;
  this.bounds.y = nY;
};

EE.Sprite.prototype.setZ = function (z) {
  this.z_index = z;
  this.game._orderSpritesZIndex();
};

EE.Sprite.prototype.collide = function (other, callback) {
  this._colliders.push(
    {
      "candidate": other,
      "callback": callback,
      "hit": false
    }
  );
};

EE.Sprite.prototype.click = function (callback) {
  this.game._addClickListener(function (event) {
    if (EE.MathUtils.contains(this.bounds, this.game.getCamera().toWorldPoint({
        x: event.offsetX,
        y: event.offsetY
      })) && this.clickable
    ) {
      callback();
    }
  }.bind(this));
};

EE.Sprite.prototype.intersects = function (other) {
  return EE.MathUtils.intersects(this.bounds, other.bounds);
};

EE.Sprite.prototype.contains = function (other) {
  return EE.MathUtils.contains(this.bounds, other.bounds);
};

EE.Sprite.prototype.setVelocity = function (x, y) {
  this.velocity.x = x;
  this.velocity.y = y;
};

EE.Sprite.prototype._checkCollision = function (nextX, nextY) {
  var bounds = {x: nextX, y: nextY, width: this.bounds.width, height: this.bounds.height};
  var _nearObjs = game.getEntitiesInBounds(bounds, this);
  for (var i = 0; i < _nearObjs.length; i++) {
    if (EE.MathUtils.intersects(_nearObjs[i].bounds, bounds)) {
      return true;
    }
  }
  return false;
};

Object.defineProperty(EE.Sprite.prototype, "x", {
  get: function () {
    return this.bounds.x;
  },
  set: function (x) {
    if (isNaN(x)) {
      throw "Can only assign a number to property x !";
    }
    this.bounds.x = x;
  }
});

Object.defineProperty(EE.Sprite.prototype, "y", {
  get: function () {
    return this.bounds.y;
  },
  set: function (y) {
    if (isNaN(y)) {
      throw "Can only assign a number to property y !";
    }
    this.bounds.y = y;
  }
});
EE.Texture = function (id, src) {
  this.id = id;
  this.src = src;
};
EE.Rect = function (x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

EE.Rect.prototype.left = function () {
  return this.x;
};

EE.Rect.prototype.right = function () {
  return this.x + this.width;
};

EE.Rect.prototype.bottom = function () {
  return this.y + this.height;
};

EE.Rect.prototype.top = function () {
  return this.y;
};
EE.Vector2 = function (x, y) {
  this.x = x;
  this.y = y;
};

EE.Vector2.lerp = function (a, b, amt) {
  var nx = a.x + (b.x - a.x) * amt;
  var ny = a.y + (b.y - a.y) * amt;
  return {x: nx, y: ny};
};
EE.Animator = function (game, obj, path, speed) {
  this.game = game;
  this.obj = obj;
  this._followPath = [];
  this._paused = false;
  this.speed = speed || 2;

  if (typeof path != "undefined" && path) {
    this.addPath(path);
  }
  this.type = EE.EntityType.UPDATABLE;
  this._init();
};

EE.Animator.prototype._init = function () {
  this.game.addEntity(this);
};

EE.Animator.prototype.update = function (dt) {
  if (this._followPath.length !== 0 && !this._paused) {
    var path = this._followPath[0];
    var to = path.to;

    var newPos = EE.Vector2.lerp(this.obj.bounds, to, this.speed * dt);
    this.obj.moveTo(newPos.x, newPos.y);
    if (Math.abs(this.obj.bounds.x - to.x) <= 0.1 && Math.abs(this.obj.bounds.y - to.y) <= 0.1) {
      if (typeof path.callback != "undefined") {
        path.callback();
      }
      this._followPath.splice(0, 1);
    }
  }
};

EE.Animator.prototype.setSpeed = function (speed) {
  if (!isNaN(speed) && speed >= 0) {
    this.speed = speed;
  }
};

EE.Animator.prototype.addPath = function (path) {
  this._followPath = this._followPath.concat(path);
};

EE.Animator.prototype.setPath = function (path) {
  this._followPath = path;
};

EE.Animator.prototype.lerpTo = function (newPos, callback) {
  this._followPath = [{to: newPos, callback: callback}];
};

EE.Animator.prototype.pause = function (timeoutMilli, callback) {
  this._paused = true;
  if (!isNaN(timeoutMilli)) {
    new EE.Timer(this.game, timeoutMilli, function () {
      if (typeof callback == "function") {
        callback();
      }
      this.resume();
    }.bind(this)).start();
  }
};

EE.Animator.prototype.resume = function () {
  this._paused = false;
};

EE.Animator.prototype.stop = function () {
  this._followPath = [];
};
EE.Camera = function (game, x, y, scale) {
  this.game = game;
  this.scale = scale || 1;
  this.objects = [];
  this.followed = null;
  this.bounds = new EE.Rect(x, y, this.game.clientWidth * this.scale, this.game.clientHeight * this.scale);

  this._followPath = [];
  this._limit = null;
  this.type = EE.EntityType.UPDATABLE;
};

EE.Camera.prototype.update = function (dt) {
  if (this.followed) {
    var bounds = this.followed.bounds;
    var newPos = EE.Vector2.lerp(this.bounds, {
      x: bounds.x - (this.bounds.width / 2) + (this.followed.bounds.width / 2),
      y: bounds.y - (this.bounds.height / 2) + (this.followed.bounds.height / 2)
    }, 2 * dt);

    this.bounds.x = newPos.x;
    this.bounds.y = newPos.y;
  }

  if (this._limit) {
    if (this.bounds.x < this._limit.x) this.bounds.x = this._limit.x;
    if (this.bounds.x + this.bounds.width > this._limit.x + this._limit.width) this.bounds.x = this._limit.x + this._limit.width - this.bounds.width;

    if (this.bounds.y < this._limit.y) this.bounds.y = this._limit.y;
    if (this.bounds.y + this.bounds.height > this._limit.y + this._limit.height) this.bounds.y = this._limit.y + this._limit.height - this.bounds.height;
  }
};

EE.Camera.prototype.setBoundsLimit = function (bounds) {
  this._limit = bounds;
};


EE.Camera.prototype.follow = function (obj) {
  this.followed = obj;
};

EE.Camera.prototype.setScale = function (scale) {
  if (scale > 1) scale = 1;
  if (scale < 0) scale = 0;
  this.scale = scale;
  this.bounds.width = this.game.clientWidth * this.scale;
  this.bounds.height = this.game.clientHeight * this.scale;
};

EE.Camera.prototype.moveOffset = function (offset) {
  this.bounds.x += offset.x;
  this.bounds.y += offset.y;
};

EE.Camera.prototype.moveTo = function (x, y) {
  this.bounds.x = x;
  this.bounds.y = y;
};

EE.Camera.prototype.toScreen = function (source) {
  return new EE.Rect((source.x - this.bounds.x) / this.scale, (source.y - this.bounds.y) / this.scale, source.width / this.scale, source.height / this.scale);
};

EE.Camera.prototype.toWorld = function (source) {
  return new EE.Rect((source.x * this.scale) + this.bounds.x, (source.y * this.scale) + this.bounds.y, source.width * this.scale, source.height * this.scale);
};

EE.Camera.prototype.toScreenPoint = function (point) {
  var pos = this.toScreen({x: point.x, y: point.y, width: 0, height: 0});
  return {x: pos.x, y: pos.y};
};

EE.Camera.prototype.toWorldPoint = function (point) {
  var pos = this.toWorld({x: point.x, y: point.y, width: 0, height: 0});
  return {x: pos.x, y: pos.y};
};
EE.EntityType = {
  UPDATABLE: 0,
  RENDERABLE: 1,
  ENTITY: 2,
  STATIC: 3,
  COLLIDABLE: 4,
};
EE.Loader = function () {
  this._promises = [];
  this._textures_load_stack = [];
  this._textures = [];
  this._loaded = false;
};

EE.Loader.prototype.init = function () {
  this.add(this._loadTextures());
};

EE.Loader.prototype.add = function (promise) {
  if (promise instanceof Promise) {
    this._promises.push(promise);
  }
};

EE.Loader.prototype.preloadTexture = function (id, src) {
  if (typeof id == "undefined") {
    throw "Texture id cannot be undefined";
  }
  if (typeof src == "undefined") {
    throw "Source cannot be undefined";
  }
  var exists = this._textures_load_stack.filter(function (elem) {
      return elem.id == id;
    }.bind(this)).length !== 0;
  if (exists) {
    throw "Duplicate texture id : " + id;
  }
  this._textures_load_stack.push(new EE.Texture(id, src));
};

EE.Loader.prototype.getTexture = function (text_id) {
  return this._textures[text_id];
};

EE.Loader.prototype.load = function () {
  return new Promise(function (resolve, reject) {
    Promise.all(this._promises).then(function (val) {
      resolve(true);
      this._loaded = true;
    }.bind(this), function (reason) {
      reject(false);
    }.bind(this));
  }.bind(this));
};

EE.Loader.prototype._loadTextures = function () {
  return new Promise(function (resolve, reject) {
    function load_recus() {
      if (this._textures_load_stack.length > 0) {
        var texture = this._textures_load_stack[this._textures_load_stack.length - 1];
        var img = new Image();
        img.src = texture.src;
        img.onload = function () {
          var index = this._textures_load_stack.indexOf(texture);
          if (index === -1) {
            throw "Texture not found in the load queue";
          }
          this._textures_load_stack.splice(index, 1);
          this._textures[texture.id] = img;
          (load_recus.bind(this))();
        }.bind(this)
      } else {
        resolve("loaded");
      }
    }

    (load_recus.bind(this))();
  }.bind(this));
};
EE.Quadtree = function (game, level, bounds, max_objects, max_levels) {
  this.max_objects = max_objects || 2;
  this.max_levels = max_levels || 10;
  this.game = game;
  this.level = level;
  this.bounds = bounds;
  this.objects = [];
  this.nodes = [];
};

EE.Quadtree.prototype.clear = function () {
  this.objects = [];
  for (var i = 0; i < this.nodes.length; i++) {
    this.nodes[i].clear();
    if (typeof this.nodes[i] !== 'undefined') {
      this.nodes[i].clear();
    }
  }
  this.nodes = [];
};

EE.Quadtree.prototype.split = function () {
  var subWidth = Math.round(this.bounds.width / 2);
  var subHeight = Math.round(this.bounds.height / 2);
  var x = Math.round(this.bounds.x);
  var y = Math.round(this.bounds.y);

  this.nodes[0] = new EE.Quadtree(this.game, this.level + 1, new EE.Rect(x + subWidth, y, subWidth, subHeight));
  this.nodes[1] = new EE.Quadtree(this.game, this.level + 1, new EE.Rect(x, y, subWidth, subHeight));
  this.nodes[2] = new EE.Quadtree(this.game, this.level + 1, new EE.Rect(x, y + subHeight, subWidth, subHeight));
  this.nodes[3] = new EE.Quadtree(this.game, this.level + 1, new EE.Rect(x + subWidth, y + subHeight, subWidth, subHeight));
};


EE.Quadtree.prototype.renderDebug = function () {
  var transformed = this.game._camera.toScreen(this.bounds);
  this.game.getRendererSurface().drawRectangle(transformed.x, transformed.y, transformed.width, transformed.height);
  for (var i = 0; i < this.nodes.length; i++) {
    this.nodes[i].renderDebug();
  }
};

EE.Quadtree.prototype.getIndex = function (rect) {
  var index = -1;
  var verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
  var horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

  var isTopQuadrant = (rect.y < horizontalMidpoint && rect.y + rect.height < horizontalMidpoint);
  var isBottomQuadrant = (rect.y > horizontalMidpoint);

  // Object can completely fit within the left quadrants
  if (rect.x < verticalMidpoint && rect.x + rect.width < verticalMidpoint) {
    if (isTopQuadrant) {
      index = 1;
    } else if (isBottomQuadrant) {
      index = 2;
    }
  } else if (rect.x > verticalMidpoint) {
    if (isTopQuadrant) {
      index = 0;
    } else if (isBottomQuadrant) {
      index = 3;
    }
  }
  return index;
};

EE.Quadtree.prototype.insert = function (obj) {
  var i = 0;
  var index;

  if (typeof this.nodes[0] !== 'undefined') {
    index = this.getIndex(obj.bounds);

    if (index !== -1) {
      this.nodes[index].insert(obj);
      return;
    }
  }

  this.objects.push(obj);

  if (this.objects.length > this.max_objects && this.level < this.max_levels) {
    if (typeof this.nodes[0] === 'undefined') {
      this.split();
    }

    while (i < this.objects.length) {
      index = this.getIndex(this.objects[i].bounds);
      if (index !== -1) {
        this.nodes[index].insert(this.objects.splice(i, 1)[0]);
      } else {
        i++;
      }
    }
  }
};

EE.Quadtree.prototype.retrieve = function (rect) {
  var ret_obj = this.objects;

  if (typeof this.nodes[0] !== 'undefined') {
    var index = this.getIndex(rect);
    if (index !== -1) {
      ret_obj = ret_obj.concat(this.nodes[index].retrieve(rect));
    } else {
      for (var i = 0; i < this.nodes.length; i++) {
        ret_obj = ret_obj.concat(this.nodes[i].retrieve(rect));
      }
    }
  }

  return ret_obj;
};

EE.Game = function (renderSurface, obj) {
  this._construct(renderSurface, obj);
};

EE.Game.prototype._construct = function (renderSurface, obj) {
  this.clientWidth = renderSurface.getSurfaceWidth();
  this.clientHeight = renderSurface.getSurfaceHeight();
  this.worldWidth = obj.worldWidth || this.clientWidth;
  this.worldHeight = obj.worldHeight || this.clientHeight;

  this._loader = new EE.Loader();
  this._renderSurface = renderSurface;
  this._context = this._renderSurface.getDrawingContext();
  this._scene = typeof obj == "function" ? new obj() : obj;
  this._click_listeners = [];
  this._entities = [];
  this._quadtree = new EE.Quadtree(this, 0, new EE.Rect(0, 0, this.worldWidth, this.worldHeight));
  this._camera = new EE.Camera(this, 0, 0, 1);
  this._keyboardController = new EE.KeyboardController(this);
  this._lastFrameUpdate = new Date();
  this._deltaTime = 0;
};

EE.Game.prototype._init = function () {
  this._renderSurface.addEventListener("mousedown", this._onClick.bind(this));
  this.addEntity(this._camera);
  EE.Utils.tryCall(this, this._scene.init);
  this._loader.init();
};

EE.Game.prototype._addClickListener = function (callback) {
  this._click_listeners.push(callback);
};

EE.Game.prototype._onClick = function (event) {
  for (var i = 0; i < this._click_listeners.length; i++) {
    (this._click_listeners[i].bind(this))(event);
  }
};

EE.Game.prototype._update = function () {
  var now = new Date();
  this._deltaTime = (now - this._lastFrameUpdate) / 1000;
  this._lastFrameUpdate = now;

  EE.Utils.tryCall(this, this._scene.preUpdate);
  this._quadtree.clear();
  for (var i = 0; i < this._entities.length; i++) {
    var ent_type = this._entities[i].type;
    if (typeof ent_type == "undefined" || ent_type == EE.EntityType.STATIC) {
      continue;
    }
    if (ent_type == EE.EntityType.ENTITY || ent_type == EE.EntityType.RENDERABLE || ent_type == EE.EntityType.COLLIDABLE) {
      this._quadtree.insert(this._entities[i]);
    }
  }

  // We have to make sure every entities are in the quadtree before updating them
  for (var i = 0; i < this._entities.length; i++) {
    var ent_type = this._entities[i].type;
    if (ent_type == EE.EntityType.UPDATABLE || ent_type == EE.EntityType.ENTITY) {
      this._entities[i].update(this._deltaTime);
    }
  }
  EE.Utils.tryCall(this, this._scene.update);
};


EE.Game.prototype._render = function () {
  this._renderSurface.beginDraw();

  EE.Utils.tryCall(this, this._scene.prerender);

  var entities = this.getEntitiesInBounds(this.getCamera().bounds);
  for (var i = 0; i < entities.length; i++) {
    var ent_type = entities[i].type;

    if (typeof ent_type == "undefined" || ent_type == EE.EntityType.COLLIDABLE) {
      continue;
    }

    entities[i].render();
  }
  EE.Utils.tryCall(this, this._scene.render);
  EE.Utils.tryCall(this, this._scene.postrender);
  this._renderSurface.endDraw();
};

EE.Game.prototype._loop = function () {
  this._update();
  this._render();
  window.requestAnimationFrame(this._loop.bind(this));
};

EE.Game.prototype._orderEntitiesZIndex = function () {
  this._entities.sort(function (a, b) {
    if (a.z_index < b.z_index) {
      return 1;
    }
    if (a.z_index > b.z_index) {
      return -1;
    }
    return 0;
  });
};

EE.Game.prototype.run = function () {
  this._init();
  // Wait until all assets are loaded before starting the loop
  this._loader.load().then(function () {
    this._loop();
  }.bind(this));
};

EE.Game.prototype.loadTexture = function (id, src) {
  this._loader.preloadTexture(id, src);
};

EE.Game.prototype.addEntity = function (entity) {
  if (typeof entity.type == "undefined") {
    console.log(entity);
    throw "Can't add an entity without a 'type' attribute defined";
  }
  this._entities.push(entity);
  return entity;
};

EE.Game.prototype.addEntities = function (entities) {
  Array.prototype.forEach.call(entities, function (entity) {
    this.addEntity(entity);
  }.bind(this));
  return entities;
};

EE.Game.prototype.removeEntity = function (entity) {
  var i = this._entities.indexOf(entity);
  if (i !== -1) {
    this._entities.splice(i, 1);
  }
};

EE.Game.prototype.addSprite = function (text_id, x, y, width, height, z_index) {
  var _spr = new EE.Sprite(this, text_id, x, y, width, height, z_index);
  this._entities.push(_spr);
  this._orderEntitiesZIndex();
  return _spr;
};

EE.Game.prototype.addBox = function (x, y, width, height, color) {
  var box = new EE.Box(this, new EE.Rect(x, y, width, height), color);
  return this.addEntity(box);
};

EE.Game.prototype.addTimer = function (delay, callback, repeat, interval) {
  return new EE.Timer(this, delay, callback, repeat, interval);
};

EE.Game.prototype.setBackground = function (color) {
  this._renderSurface.setBackgroundColor(color);
};

EE.Game.prototype.click = function (callback) {
  this._addClickListener(callback);
};

EE.Game.prototype.getEntities = function (filterType) {
  if (typeof filterType != "undefined") {
    return this._entities.filter(function (elem) {
      return elem instanceof filterType
    }.bind(this));
  }
  return this._entities;
};

EE.Game.prototype.getTexture = function (text_id) {
  return this._loader.getTexture(text_id);
};

EE.Game.prototype.getEntitiesInBounds = function (bounds, except) {
  var list = this._quadtree.retrieve(bounds);

  if (typeof except !== "undefined") {
    return list.filter(function (item) {
      return item != except;
    });
  }
  return list;
};

EE.Game.prototype.getCamera = function () {
  return this._camera;
};

EE.Game.prototype.getRendererSurface = function () {
  return this._renderSurface;
};

EE.Game.prototype.getCursor = function () {
  return this._renderSurface.getCursor();
};

EE.Game.prototype.isDown = function (keyCode) {
  return this._keyboardController.pressed(keyCode);
};
EE.GameHost = function(gameWidth, gameHeight) {
  this._construct(new EE.NullRenderSurface(1280, 1200), {});
};

EE.GameHost.prototype = new EE.Game(new EE.NullRenderSurface(1280, 1200), {});