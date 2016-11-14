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
