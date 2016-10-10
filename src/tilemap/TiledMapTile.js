EE.TiledMapTile = function(layer, img, sx, sy, sw, sh, x, y, w, h) {
    this.layer = layer;
    this.img = img;
    this.sx = sx;
    this.sy = sy;
    this.sw = sw;
    this.sh = sh;
    this.bounds = new EE.Rect(x, y, w, h);
};

EE.TiledMapTile.prototype.toImage = function() {
    var canvas = document.createElement("canvas");
    canvas.width = this.bounds.width;
    canvas.height = this.bounds.height;
    canvas.getContext("2d").drawImage(
        this.img, 
        this.sx,
        this.sy, 
        this.sw, 
        this.sh,
        0,
        0,
        this.bounds.width,
        this.bounds.height
    );
    var _img = new Image();
    _img.setAttribute('crossOrigin', 'anonymous');
    _img.src = canvas.toDataURL("image/png");
    return _img;
};

EE.TiledMapTile.prototype.update = function(dt) {

};
