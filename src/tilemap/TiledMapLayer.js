EE.TiledMapLayer = function(map, tileset, xmlNode) {
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
    for(var j = 0; j < tmpArr.length; j++) {
        this.data.push(parseInt(tmpArr[j]));
    }
    this.id = this.attrs.name || new EE.Guid().get();
    this._img = null;
    this._collisionEnabled = false;
};

EE.TiledMapLayer.prototype.load = function() {
    return new Promise((resolve, reject) => {
        try {
            var img = new Image();
            img.src = this.tileset.image.attrs.source;
            img.onload = () => {
                this.map.game.loadTexture(this.id, this.tileset.image.attrs.source);

                var tileWidth = parseInt(this.tileset.attrs.tilewidth);
                var tileHeight = parseInt(this.tileset.attrs.tileheight);

                var imgWidth = parseInt(this.tileset.image.attrs.width);
                var imgHeight = parseInt(this.tileset.image.attrs.height);
                
                var rows = imgWidth / tileWidth;
                var cols = imgHeight / tileHeight;

                var width = parseInt(this.attrs.width);
                var height = parseInt(this.attrs.height);

                for(var i = 0; i < this.data.length; i++) {
                    if(this.data[i] === 0) continue;
                    var tileAmountWidth = imgWidth / tileWidth;

                    var y = Math.ceil(this.data[i] / tileAmountWidth) - 1;
                    var x = this.data[i] - (tileAmountWidth * y) - 1;
                    var tile = new EE.TiledMapTile(this, img, Math.ceil(x * tileWidth),
                                        Math.ceil(y * tileHeight), tileWidth, tileHeight, 
                                        (Math.floor(i%width) * tileWidth * this.map.scale),
                                        (Math.floor(i/width) * tileHeight * this.map.scale),
                                        tileWidth * this.map.scale,  tileHeight * this.map.scale, this.data[i]);
                    this.tiles.push(tile);
                }
                this.loaded = true;
                this._create_tile();
                resolve("layer loaded");
            };
        } catch(e) {
            reject("Error during loading of the layer");
        }
    });
};

EE.TiledMapLayer.prototype._create_tile = function() {
    var canvas = document.createElement("canvas");
    canvas.width = this.map.bounds.width;
    canvas.height = this.map.bounds.height;

    var img_ids = [];
    var ctx = canvas.getContext("2d");
    for(var i = 0; i < this.tiles.length; i++) {
        var tile = this.tiles[i];
        ctx.drawImage(tile.img, tile.sx, tile.sy, tile.sw, tile.sh, tile.bounds.x, tile.bounds.y, tile.bounds.width, tile.bounds.height);
    }

    this._img = new Image();
    this._img.setAttribute('crossOrigin', 'anonymous');
    this._img.src = canvas.toDataURL("image/png");
};

EE.TiledMapLayer.prototype.enableCollision = function() {
    if(!this.loaded) {
        throw "Can't call enableCollision before the layer is loaded";
    }
    if(this._collisionEnabled) {
        return;
    }
    this.map.game.addEntities(this.tiles);
};

EE.TiledMapLayer.prototype.render = function(debug) {
    if(this.loaded && (this.attrs.visible != "false")) {
        var transformed = this.map.game._camera.toScreen(
        {
            x: 0,
            y: 0,
            width: this._img.width, 
            height: this._img.height
        });
        this.map.game.getRenderer().drawImage(this._img, transformed.x, transformed.y, transformed.width, transformed.height);
    }
    if(debug) {
        for(var i = 0; i < this.tiles.length; i++) {
            this.tiles[i].render();
        }
    }
};
