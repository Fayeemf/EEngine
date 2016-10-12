EE.Sprite = function(game, text_id, x, y, width, height, z_index) {
    this.game = game;
    this.text_id = text_id;
    this.bounds = new EE.Rect(x, y, width, height);
    this._colliders = [];
    this.z_index = z_index || 0;
    this.visible = true;
    this.clickable = true;
    this.type = EE.EntityType.ENTITY;
};

EE.Sprite.prototype.render = function() {
    if(!this.visible) {
        return;
    }
    var texture = this.game.getTexture(this.text_id);
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

EE.Sprite.prototype._checkCollision = function(nextX, nextY) {
    var bounds = {x: nextX, y: nextY, width: this.bounds.width, height: this.bounds.height};
    var _nearObjs = game.getEntitiesInBounds(bounds, this);
    for(var i = 0; i < _nearObjs.length; i++) {
        if(EE.MathUtils.intersects(_nearObjs[i].bounds, bounds)) {
            return true;
        }
    }
    return false;
};

EE.Sprite.prototype.moveTo = function(x, y) {
    if(this._checkCollision(x, y)) {
        return;
    }
    this.bounds.x = x;
    this.bounds.y = y;
};

EE.Sprite.prototype.moveOffset = function(x, y) {
    var nX = this.bounds.x + (x || 0);
    var nY = this.bounds.y + (y || 0);
    if(this._checkCollision(nX, nY)) {
        return;
    }
    this.bounds.x = nX;
    this.bounds.y = nY;
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
        if(EE.MathUtils.contains(this.bounds, this.game.getCamera().toWorldPoint({x: event.offsetX, y: event.offsetY})) && this.clickable){
            callback();
        }
    });
};

EE.Sprite.prototype.intersects = function(other) {
    return EE.MathUtils.intersects(this.bounds, other.bounds);
};

EE.Sprite.prototype.contains = function(other) {
    return EE.MathUtils.contains(this.bounds, other.bounds);
};