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