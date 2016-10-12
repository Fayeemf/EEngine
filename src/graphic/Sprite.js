EE.Sprite = function(game, text_id, x, y, width, height, z_index) {
    this.game = game;
    this.text_id = text_id;
    this.bounds = new EE.Rect(x, y, width, height);
    this._colliders = [];
    this.z_index = z_index || 0;
    this.visible = true;
    this.clickable = true;
    this.components = [];
    this.type = EE.EntityType.ENTITY;
};

EE.Sprite.prototype.render = function() {
    for(var i = 0; i < this.components.length; i++) {
        EE.Utils.tryCall(this, this.components[i].render);
    }
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
    for(var i = 0; i < this.components.length; i++) {
        EE.Utils.tryCall(this, this.components[i].update);
    }
};

EE.Sprite.prototype.addComponent = function(component) {
    instance = typeof component == "function" ? new (Function.prototype.bind.apply(component, arguments)) : component;
    this.components.push(instance);
    EE.Utils.tryCall(this, instance.init);
    return instance;
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

Object.defineProperty(EE.Sprite.prototype, "x", {
    get: function(){
        return this.bounds.x;
    },
    set: function(x) {
        if(isNaN(x)) {
            throw "Can only assign a number to property x !";
        }
        this.bounds.x = x;
    }
});

Object.defineProperty(EE.Sprite.prototype, "y", {
    get: function(){
        return this.bounds.y;
    },
    set: function(y) {
        if(isNaN(y)) {
            throw "Can only assign a number to property x !";
        }
        this.bounds.y = y;
    }
});