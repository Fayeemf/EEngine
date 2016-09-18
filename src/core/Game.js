EE.Game = function(canvas, obj) {
    this.clientWidth = canvas.width;
    this.clientHeight = canvas.height;
    this.worldWidth = obj.worldWidth || this.clientWidth;
    this.worldHeight = obj.worldHeight || this.clientHeight;
    this.debug = false;
    this.cursor = new EE.Cursor(this);

    this._canvas = canvas;
    this._framerate = 60;
    this._context = this._canvas.getContext("2d");
    this._scene = typeof obj == "function" ? new obj() : obj; 
    this._textures = [];
    this._textures_load_stack = [];
    this._click_listeners = [];
    this._entities = [];
    this._updatables = [];
    this._renderables = [];
    this._quadtree = new EE.Quadtree(this, 0, new EE.Rect(0, 0, this.worldWidth, this.worldHeight));
    this._camera = new EE.Camera(this, 0, 0, 1);
    this._renderer = new EE.GraphicRenderer(this);
    this._keyboardController = new EE.KeyboardController(this);
    this._lastFrameUpdate = new Date();
    this._deltaTime = 0;
}

EE.Game.prototype._tryCall = function(callable) {
    if(typeof callable === "function") {
        (callable.bind(this))();
    }
}

EE.Game.prototype._init = function() {
    this._canvas.addEventListener("mousedown", this._onClick.bind(this));
    this.cursor.init();
    this.addUpdatable(this._camera);
    this._tryCall(this._scene.init);
}

EE.Game.prototype._addClickListener = function(callback) {
    this._click_listeners.push(callback);
}

EE.Game.prototype._onClick = function(event) {
    for(var i = 0; i < this._click_listeners.length; i++) {
        (this._click_listeners[i].bind(this))(event);
    }
}

EE.Game.prototype._loadTextures = function(callback) {
    if(this._textures_load_stack.length > 0) {
        var texture = this._textures_load_stack[this._textures_load_stack.length - 1];
        var img = new Image();
        img.src = texture.src;
        img.onload = () => {
            var index = this._textures_load_stack.indexOf(texture);
            if (index === -1) {
                throw "Texture not found in the load queue";
            }
            this._textures_load_stack.splice(index, 1);
            this._textures[texture.id] = img;
            this._loadTextures(callback);
        }
    } else {
        callback();
    }
}

EE.Game.prototype._update = function() {
    var now = new Date();
    this._deltaTime = (now - this._lastFrameUpdate) / 1000;
    this._lastFrameUpdate = now;

    this._tryCall(this._scene.preUpdate);
    this._quadtree.clear();
    for(var i = 0; i < this._entities.length; i++) {
        this._quadtree.insert(this._entities[i]);
        this._entities[i].update(this._deltaTime);
    }
    for(var i = 0; i < this._renderables.length; i++) {
        this._quadtree.insert(this._renderables[i]);
    }
    for(var i = 0; i < this._updatables.length; i++) {
        this._updatables[i].update(this._deltaTime);
    }
    this._tryCall(this._scene.update);
}

EE.Game.prototype._render = function() {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.beginPath();

    var toRender = this.getEntitiesInBounds(this._camera.x, this._camera.y, this._camera.vWidth, this._camera.vHeight);
    for(var i = 0; i < toRender.length; i++) {
        toRender[i].render();
    }
    this._tryCall(this._scene.render);
    this._context.closePath();
}

EE.Game.prototype._loop = function() {
    this._update();
    this._render();
    setTimeout(() => {
        window.requestAnimationFrame(this._loop.bind(this));
    }, 1000 / this._framerate);
}

EE.Game.prototype._orderEntitiesZIndex = function() {
    this._entities.sort(function(a, b) {
        if(a.z_index < b.z_index) {
            return 1;
        }
        if(a.z_index > b.z_index) {
            return -1;
        }
        return 0;
    });
}

EE.Game.prototype.run = function() {
    this._init();
    
    // Wait until all sprites are loaded before starting the loop
    this._loadTextures(() => {
        this._loop();
    });
}

EE.Game.prototype.loadTexture = function(id, src) {
    // TODO : check if the sprite hasnt been already added
    this._textures_load_stack.push(new EE.Texture(id, src));
}

EE.Game.prototype.addEntity = function(entity) {
    this._entities.push(entity);
    return entity;
}

EE.Game.prototype.addUpdatable = function(updatable) {
    this._updatables.push(updatable);
    return updatable;
}

EE.Game.prototype.addRenderable = function(renderable) {
    this._renderables.push(renderable);
    return renderable;
}

EE.Game.prototype.removeEntity = function(entity) {
    var i = this._entities.indexOf(entity);
    if(i !== -1) {
        this._entities.splice(i, 1);
    }
}

EE.Game.prototype.removeUpdatable = function(entity) {
    var i = this._updatables.indexOf(entity);
    if(i !== -1) {
        this._updatables.splice(i, 1);
    }
}

EE.Game.prototype.removeRenderable = function(entity) {
    var i = this._renderables.indexOf(entity);
    if(i !== -1) {
        this._renderables.splice(i, 1);
    }
}

EE.Game.prototype.addSprite = function(text_id, x, y, width, height, z_index) {
    var _spr = new EE.Sprite(this, text_id, x, y, width, height, z_index);
    this._entities.push(_spr);
    this._orderEntitiesZIndex();
    return _spr;
}

EE.Game.prototype.addBox = function(x, y, width, height, color) {
    var box = new EE.Box(this, new EE.Rect(x, y, width, height), color);
    return this.addEntity(box);
}

EE.Game.prototype.addTimer = function(delay, callback, repeat, interval) {
    return new EE.Timer(this, delay, callback, repeat, interval);
}

EE.Game.prototype.setBackground = function(color) {
    this._canvas.style.backgroundColor = color;
}

EE.Game.prototype.click = function(callback) {
    this._addClickListener(callback);
}

EE.Game.prototype.getEntities = function(filterType) {
    if(typeof filterType != "undefined") {
        return this._entities.filter((elem) => { return elem instanceof filterType } );
    }
    return this._entities;
}

EE.Game.prototype.getEntitiesInBounds = function(bounds) {
    var list = this._quadtree.retrieve(bounds);
    return list;
}

EE.Game.prototype.getCamera = function() {
    return this._camera;
}

EE.Game.prototype.getRenderer = function() {
    return this._renderer;
}

EE.Game.prototype.isDown = function(keyCode) {
    return this._keyboardController.pressed(keyCode);
}