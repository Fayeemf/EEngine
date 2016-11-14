EE.Animator = function (game, obj, path, speed) {
  this.game = game;
  this.obj = obj;
  this._followPath = [];
  this._paused = false;
  this.speed = speed || 2;

  if (typeof path != "undefined" && path) {
    this.addPath(path);
  }
  this.type = EE.EntityType.UPDATABLE;
  this._init();
};

EE.Animator.prototype._init = function () {
  this.game.addEntity(this);
};

EE.Animator.prototype.update = function (dt) {
  if (this._followPath.length !== 0 && !this._paused) {
    var path = this._followPath[0];
    var to = path.to;

    var newPos = EE.Vector2.lerp(this.obj.bounds, to, this.speed * dt);
    this.obj.moveTo(newPos.x, newPos.y);
    if (Math.abs(this.obj.bounds.x - to.x) <= 0.1 && Math.abs(this.obj.bounds.y - to.y) <= 0.1) {
      if (typeof path.callback != "undefined") {
        path.callback();
      }
      this._followPath.splice(0, 1);
    }
  }
};

EE.Animator.prototype.setSpeed = function (speed) {
  if (!isNaN(speed) && speed >= 0) {
    this.speed = speed;
  }
};

EE.Animator.prototype.addPath = function (path) {
  this._followPath = this._followPath.concat(path);
};

EE.Animator.prototype.setPath = function (path) {
  this._followPath = path;
};

EE.Animator.prototype.lerpTo = function (newPos, callback) {
  this._followPath = [{to: newPos, callback: callback}];
};

EE.Animator.prototype.pause = function (timeoutMilli, callback) {
  this._paused = true;
  if (!isNaN(timeoutMilli)) {
    new EE.Timer(this.game, timeoutMilli, function () {
      if (typeof callback == "function") {
        callback();
      }
      this.resume();
    }.bind(this)).start();
  }
};

EE.Animator.prototype.resume = function () {
  this._paused = false;
};

EE.Animator.prototype.stop = function () {
  this._followPath = [];
};