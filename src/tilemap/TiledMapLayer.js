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

};

EE.TiledMapLayer.prototype.load = function() {
    return new Promise((resolve, reject) => {
        try {
            var img = new Image();
            img.src = this.tileset.image.attrs.source;
            img.onload = () => {
                this.loaded = true;
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
                    var tileAmountWidth = imgWidth / tileWidth;

                    var y = Math.ceil(this.data[i] / tileAmountWidth) - 1;
                    var x = this.data[i] - (tileAmountWidth * y) - 1;
                    var tile = new EE.TiledMapTile(this, img, Math.ceil(x * tileWidth),
                                        Math.ceil(y * tileHeight), tileWidth, tileHeight, 
                                        (Math.floor(i%width) * tileWidth * this.map.scale),
                                        (Math.floor(i/width) * tileHeight * this.map.scale),
                                        tileWidth * this.map.scale,  tileHeight * this.map.scale);
                    this.tiles.push(tile);
                }
                resolve("layer loaded");
            };
        } catch(e) {
            reject("Error during loading of the layer");
        }
    });
};

EE.TiledMapLayer.prototype.render = function() {
    if(this.loaded && (this.attrs.visible != "false")) {
        for(var i = 0; i < this.tiles.length; i++) {
            this.tiles[i].render();
        }
    }
};
