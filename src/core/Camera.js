EE.Camera = function(game, x, y, scale) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.scale = scale || 1;
    this.objects = [];
    this.vWidth = this.game.clientWidth * this.scale;
    this.vHeight = this.game.clientHeight * this.scale;
    this.followed = null;
}

EE.Camera.prototype.update = function() {
    if(this.followed) {
        this.centerObject(this.followed);
    }
}

EE.Camera.prototype.centerObject = function(obj) {
    var bounds = this.followed.bounds;
    this.x = bounds.x - (this.vWidth / 2) + (this.followed.bounds.width / 2);
    console.log(this.vWidth);
    this.y = bounds.y - (this.vHeight / 2) + (this.followed.bounds.height / 2);
}

EE.Camera.prototype.follow = function(obj) {
    this.followed = obj;
}

EE.Camera.prototype.setScale = function(scale) {
        if(scale > 1) scale = 1;
        if(scale < 0) scale = 0;
        this.scale = scale;
        this.vWidth = this.game.clientWidth * this.scale;
        this.vHeight = this.game.clientHeight * this.scale;
}

EE.Camera.prototype.moveOffset = function(offset) {
    this.x += offset.x;
    this.y += offset.y;
}

EE.Camera.prototype.moveTo = function(newPos) {
    this.x = newPos.x;
    this.y = newPos.y;
}

EE.Camera.prototype.toScreen = function(source) {
    return new EE.Rect((source.x - this.x) / this.scale, (source.y - this.y) / this.scale, source.width / this.scale, source.height / this.scale); 
}

EE.Camera.prototype.toWorld = function(source) {
    return new EE.Rect((source.x * this.scale) + this.x, (source.y * this.scale) + this.y, source.width * this.scale, source.height * this.scale);
}

EE.Camera.prototype.toScreenPoint = function(point) {
    var pos = this.toScreen({x:point.x, y:point.y, width:0, height:0});
    return {x:pos.x, y:pos.y};
}

EE.Camera.prototype.toWorldPoint = function(point) {
    var pos = this.toWorld({x:point.x, y:point.y, width:0, height:0});
    return {x:pos.x, y:pos.y};
}