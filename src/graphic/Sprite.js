EE.Sprite = function(game, text_id, x, y, width, height, z_index) {
    this.game = game;
    this.text_id = text_id;
    this.bounds = new EE.Rect(x, y, width, height);
    this._colliders = [];
    this.z_index = z_index || 0;
    this.visible = true;
    this.clickable = true;
};

EE.Sprite.prototype.render = function() {
    if(!this.visible) {
        return;
    }
    var texture = this.game._textures[this.text_id];
    var width = this.bounds.width || texture.width;
    var height = this.bounds.height || texture.height;
    var transformed = this.game._camera.toScreen({x:this.bounds.x, y:this.bounds.y, width:width, height:height});
    this.game._renderer.drawImage(texture, transformed.x, transformed.y, transformed.width, transformed.height);
};

EE.Sprite.prototype.update = function(dt) {
    for(var i = 0; i < this._colliders.length; i++) {
        if(this.intersects(this._colliders[i].candidate)) {         
            if(!this._colliders[i].hit) {
                this._colliders[i].callback();
            }
            this._colliders[i].hit = true;
        } else {
            this._colliders[i].hit = false;
        }
    }
};

EE.Sprite.prototype.moveTo = function(x, y) {
    this.bounds.x = x;
    this.bounds.y = y;
};

EE.Sprite.prototype.setZ = function(z) {
    this.z_index = z;
    this.game._orderSpritesZIndex();
};

EE.Sprite.prototype.collide = function(other, callback) {
    this._colliders.push(
        {
            "candidate": other,
            "callback": callback,
            "hit": false
        }
    );
};

EE.Sprite.prototype.click = function(callback) {
    this.game._addClickListener((event) => {
        if(this.contains(this.game.getCamera().toWorldPoint({x: event.offsetX, y: event.offsetY})) && this.clickable){
            callback();
        }
    });
};

EE.Sprite.prototype.intersects = function(other) {
    return !(other.bounds.left() > this.bounds.right() || 
        other.bounds.right() < this.bounds.left() || 
        other.bounds.top() > this.bounds.bottom() ||
        other.bounds.bottom() < this.bounds.top());
};

EE.Sprite.prototype.contains = function(p) {
    return (this.bounds.x < p.x && this.bounds.y < p.y &&
            this.bounds.x + this.bounds.width > p.x  &&
            this.bounds.y + this.bounds.height > p.y);
};