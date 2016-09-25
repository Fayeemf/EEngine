EE.TiledMapTile = function(layer, img, sx, sy, sw, sh, x, y, w, h) {
    this.layer = layer;
    this.img = img;
    this.sx = sx;
    this.sy = sy;
    this.sw = sw;
    this.sh = sh;
    this.bounds = new EE.Rect(x, y, w, h);
};

EE.TiledMapTile.prototype.render = function() {
    var transformed = this.layer.map.game._camera.toScreen(
    {
        x: this.bounds.x,
        y: this.bounds.y,
        width: this.bounds.width, 
        height: this.bounds.height
    });
    this.layer.map.game.getRenderer().drawImagePart(
        this.img, 
        this.sx,
        this.sy, 
        this.sw, 
        this.sh, 
        transformed.x, 
        transformed.y, 
        transformed.width, 
        transformed.height
    );
};

EE.TiledMapTile.prototype.update = function(dt) {

};
