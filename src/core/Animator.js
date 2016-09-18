EE.Animator = function(game, obj, path) {
    this.game = game;
    this.obj = obj;
    this._followPath = [];
    this._paused = false;
    
    if(typeof path != "undefined") {
        this.addPath(path);
    }
    this._init();
}

EE.Animator.prototype._init = function() {
    this.game.addUpdatable(this);
}

EE.Animator.prototype.update = function(dt) {
    if(this._followPath.length !== 0 && !this._paused) {
        var path = this._followPath[0];
        var to = path.to;

        var newPos = EE.Vector2.lerp(this.obj.bounds, to, 5 * dt);
        this.obj.moveTo(newPos.x, newPos.y);
        if(Math.abs(this.obj.bounds.x - to.x) <= 0.1 && Math.abs(this.obj.bounds.y - to.y) <= 0.1) {
            if(typeof path.callback != "undefined") {
                path.callback();
            }
            this._followPath.splice(0, 1);
        }
    }
}

EE.Animator.prototype.addPath = function(path) {
    this._followPath = this._followPath.concat(path);
}

EE.Animator.prototype.setPath = function(path) {
    this._followPath = path;
}

EE.Animator.prototype.lerpTo = function(newPos, callback) {
    this._followPath = [{to: newPos, callback:callback}];
}

EE.Animator.prototype.pause = function(timeoutMilli, callback) {
    this._paused = true;
    if(!isNaN(timeoutMilli)) {
        new EE.Timer(this.game, timeoutMilli, () => {
            if(typeof callback == "function") {
                callback();
            }
            this.resume();
        }).start();
    }
}

EE.Animator.prototype.resume = function() {
    this._paused = false;
}

EE.Animator.prototype.stop = function() {
    this._followPath = [];
}