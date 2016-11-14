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