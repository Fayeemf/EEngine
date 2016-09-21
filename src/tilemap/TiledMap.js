function parseConfig(xml, config) {
    var attrs = {};
    for(var i = 0; i < config.length; i++) {
        var attr = config[i];
        var elem = xml.getAttribute(attr);
        if(typeof elem != "undefined") {
            attrs[attr] = elem;
        }
    }
    return attrs;
}

EE.TiledMap = function(game, src, scale) {
    this.game = game;
    this.src = src;
    this.scale = scale;

    this.firstgid;
    this.name;
    this.tilewidth;
    this.tileheight;
    this.tilecount;
    this.source;
    this.source_width;
    this.source_height;
    this.layers = [];

    this._loadcb = null;
    this.conf = ["version", "orientation", "renderorder", "width", "height",
        "tilewidth", "tileheight", "hexsidelength", "staggeraxis", "staggerindex",
        "backgroundcolor", "nextobjectid"];
    this.attrs = [];
    this.tilesets = [];

}

EE.TiledMap.prototype.init = function() {
    var xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xhr.onload = () => {this._loaded(xhr); };
    xhr.open("GET", this.src);
    xhr.send();
}

EE.TiledMap.prototype.onLoad = function(callback) {
    if(typeof callback != "function") {
        throw "onLoad callback must be a function, " + typeof callback + " provided";
    }
    this._loadcb = callback;
}

EE.TiledMap.prototype._loaded = function(xhr) {
    var resp = xhr.responseText;
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(resp, "text/xml");
    if(this._loadcb) {
        this._loadcb(resp);
    }

    this.attrs = parseConfig(xmlDoc.getElementsByTagName("map")[0], this.conf);
    var tilesetsXml = xmlDoc.getElementsByTagName("tileset");
    for(var i = 0; i < tilesetsXml.length; i++) {
        this.tilesets.push(new EE.TiledMapTileset(this, tilesetsXml[i]));
    }

    var layers = xmlDoc.getElementsByTagName("layer");
    for(var i = 0; i < layers.length; i++) {
        var data = layers[i].getElementsByTagName("data")[0].textContent;
        var layer = new EE.TiledMapLayer(this, this.tilesets[0], layers[i], data);
        this.layers.push(layer);
        layer.init();
    }
} 

EE.TiledMap.prototype._getFromTag = function(xmlDoc, tagname, attr, toInt) {
    var val =  xmlDoc.getElementsByTagName(tagname)[0].getAttribute(attr);
    if(toInt) {
        return parseInt(val);
    }
    return val;
}

EE.TiledMap.prototype.render = function() {
    for(var i = 0; i < this.layers.length; i++) {
        this.layers[i].render();
    } 
}


EE.TiledMapTileset = function(map, xmlNode) {
    this.map = map;
    this.xml = xmlNode;

    this.conf = ["firstgid", "source", "name", "tilewidth", "tileheight",
        "spacing", "margin", "tilecount", "columns"];
    this.attrs = parseConfig(this.xml, this.conf);
    this.image = new EE.TiledMapImage(this.map, this, this.xml.getElementsByTagName("image")[0]);
}

EE.TiledMapImage = function(map, tileset, xmlNode) {
    this.map = map;
    this.xml = xmlNode;
    this.tileset = tileset;

    this.conf = ["format", "id", "source", "trans", "width", "height"];
    this.attrs = parseConfig(this.xml, this.conf);
}


EE.TiledMapLayer = function(map, tileset, xmlNode) {
    this.map = map;
    this.xml = xmlNode;
    this.tileset = tileset;

    this.conf = ["name", "x", "y", "width", "height", "opacity", "visible",
        "offsetx", "offsety"];
    this.attrs = parseConfig(this.xml, this.conf);

    var tmpData = xmlNode.getElementsByTagName("data")[0].textContent;
    this.data = [];
    
    var tmpArr = tmpData.split(',');
    for(var j = 0; j < tmpArr.length; j++) {
        this.data.push(parseInt(tmpArr[j]));
    }
}

EE.TiledMapLayer.prototype.init = function() {
    this.img = new Image();
    this.img.src = this.tileset.image.attrs["source"];
}

EE.TiledMapLayer.prototype.render = function() {
    if(this.img.complete) {
        var tileWidth = parseInt(this.tileset.attrs["tilewidth"]);
        var tileHeight = parseInt(this.tileset.attrs["tileheight"]);

        var imgWidth = parseInt(this.tileset.image.attrs["width"]);
        var imgHeight = parseInt(this.tileset.image.attrs["height"]);
        
        var rows = imgWidth / tileWidth;
        var cols = imgHeight / tileHeight;

        var width = parseInt(this.attrs["width"]);
        var height = parseInt(this.attrs["height"]);

        for(var i = 0; i < this.data.length; i++) {
            var tileAmountWidth = imgWidth / tileWidth;

            var y = Math.ceil(this.data[i] / tileAmountWidth) - 1;
            var x = this.data[i] - (tileAmountWidth * y) - 1;

            var transformed = this.map.game._camera.toScreen(
                {
                    x: (Math.floor(i%width) * tileWidth * this.map.scale),
                    y:(Math.floor(i/width) * tileHeight * this.map.scale),
                    width: tileWidth * this.map.scale, 
                    height: tileHeight * this.map.scale
                });
            
            this.map.game.getRenderer().drawImagePart(
                this.img, 
                x * tileWidth,
                y * tileHeight, 
                tileWidth, 
                tileHeight, 
                transformed.x, 
                transformed.y, 
                transformed.width, 
                transformed.height);
        }
        
    }
    
}