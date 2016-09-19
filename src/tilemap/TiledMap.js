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

    this.firstgid = xmlDoc.getElementsByTagName("tileset")[0].getAttribute("firstgid");
    this.name = this._getFromTag(xmlDoc, "tileset", "name");
    this.tilewidth = this._getFromTag(xmlDoc, "tileset", "tilewidth", true);
    this.tileheight = this._getFromTag(xmlDoc, "tileset", "tileheight", true);
    this.tilecount = this._getFromTag(xmlDoc, "tileset", "tilecount", true);
    this.source = this._getFromTag(xmlDoc, "image", "source");
    this.source_width = this._getFromTag(xmlDoc, "image", "width", true);
    this.source_height = this._getFromTag(xmlDoc, "image", "height");

    var layers = xmlDoc.getElementsByTagName("layer");
    for(var i = 0; i < layers.length; i++) {
        var l = layers[i];

        var layername = l.getAttribute("name");
        var layerWidth = parseInt(l.getAttribute("width"));
        var layerHeight = parseInt(l.getAttribute("height"));
        var encoding = this._getFromTag(l, "data", "encoding");
        var data = l.getElementsByTagName("data")[0].textContent;
        var tmpArr = data.split(',');
        var arr = [];
        for(var j = 0; j < tmpArr.length; j++) {
            arr.push(parseInt(tmpArr[j]));
        }
        var layer = new EE.TiledMapLayer(this, layername, layerWidth, layerHeight, arr, encoding);
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

EE.TiledMapLayer = function(tilemap, name, width, height, data, encoding) {
    this.tilemap = tilemap;
    this.name = name;
    this.width = width;
    this.height = height;
    this.data = data;
    this.encoding = encoding;

    this.img;
}

EE.TiledMapLayer.prototype.init = function() {
    this.img = new Image();
    this.img.src = this.tilemap.source;
}

EE.TiledMapLayer.prototype.render = function() {
    if(this.img.complete) {
        var rows = this.tilemap.source_width / this.tilemap.tilewidth;
        var cols = this.tilemap.source_height / this.tilemap.tileheight;
        for(var i = 0; i < this.data.length; i++) {
            var tileAmountWidth = this.tilemap.source_width / this.tilemap.tilewidth;

            var y = Math.ceil(this.data[i] / tileAmountWidth) - 1;
            var x = this.data[i] - (tileAmountWidth * y) - 1;
            
            this.tilemap.game.getRenderer().drawImagePart(
                this.img, 
                x * this.tilemap.tilewidth,
                y * this.tilemap.tileheight, 
                this.tilemap.tilewidth, 
                this.tilemap.tileheight, 
                (Math.floor(i%this.width) * this.tilemap.tilewidth * this.tilemap.scale), 
                (Math.floor(i/this.width) * this.tilemap.tileheight * this.tilemap.scale), 
                this.tilemap.tilewidth * this.tilemap.scale, 
                this.tilemap.tileheight * this.tilemap.scale);
        }
        
    }
    
}