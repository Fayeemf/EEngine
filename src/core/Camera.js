EE.Camera = function(game, x, y, scale) {
    this.game = game;
    this.scale = scale || 1;
    this.objects = [];
    this.followed = null;
    this.bounds = new EE.Rect(x, y, this.game.clientWidth * this.scale, this.game.clientHeight * this.scale);

    this._followPath = [];
}

EE.Camera.prototype.update = function() {
    if(this.followed) {
        this.centerObject(this.followed);
    }
}

EE.Camera.prototype.centerObject = function(obj) {
    var bounds = this.followed.bounds;
    this.bounds.x = bounds.x - (this.bounds.width / 2) + (this.followed.bounds.width / 2);
    this.bounds.y = bounds.y - (this.bounds.height / 2) + (this.followed.bounds.height / 2);
}

EE.Camera.prototype.follow = function(obj) {
    this.followed = obj;
}

EE.Camera.prototype.setScale = function(scale) {
    if(scale > 1) scale = 1;
    if(scale < 0) scale = 0;
    this.scale = scale;
    this.bounds.width = this.game.clientWidth * this.scale;
    this.bounds.height = this.game.clientHeight * this.scale;
}

EE.Camera.prototype.moveOffset = function(offset) {
    this.bounds.x += offset.x;
    this.bounds.y += offset.y;
}

EE.Camera.prototype.moveTo = function(x, y) {
    this.bounds.x = x;
    this.bounds.y = y;
}

EE.Camera.prototype.toScreen = function(source) {
    return new EE.Rect((source.x - this.bounds.x) / this.scale, (source.y - this.bounds.y) / this.scale, source.width / this.scale, source.height / this.scale); 
}

EE.Camera.prototype.toWorld = function(source) {
    return new EE.Rect((source.x * this.scale) + this.bounds.x, (source.y * this.scale) + this.bounds.y, source.width * this.scale, source.height * this.scale);
}

EE.Camera.prototype.toScreenPoint = function(point) {
    var pos = this.toScreen({x:point.x, y:point.y, width:0, height:0});
    return {x:pos.x, y:pos.y};
}

EE.Camera.prototype.toWorldPoint = function(point) {
    var pos = this.toWorld({x:point.x, y:point.y, width:0, height:0});
    return {x:pos.x, y:pos.y};
}