EE.TiledMapTile = function(layer, img, sx, sy, sw, sh, x, y, w, h, id) {
    this.layer = layer;
    this.img = img;
    this.sx = sx;
    this.sy = sy;
    this.sw = sw;
    this.sh = sh;
    this.bounds = new EE.Rect(x, y, w, h);
    this.id = id;
    this.type = EE.EntityType.STATIC;
};

EE.TiledMapTile.prototype.update = function(dt) {

};

EE.TiledMapTile.prototype.render = function(dt) {

};

EE.TiledMapTile.prototype.getProperty = function(prop_name) {
    return this.layer.map.properties[prop_name];
};
