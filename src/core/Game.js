EE.Game = function(canvas, obj) {
    this.clientWidth = canvas.width;
    this.clientHeight = canvas.height;
    this.worldWidth = obj.worldWidth || this.clientWidth;
    this.worldHeight = obj.worldHeight || this.clientHeight;
    this.debug = false;
    this.cursor = new EE.Cursor(this);

    this._loader = new EE.Loader();
    this._canvas = canvas;
    this._context = this._canvas.getContext("2d");
    this._scene = typeof obj == "function" ? new obj() : obj; 
    this._click_listeners = [];
    this._entities = [];
    this._quadtree = new EE.Quadtree(this, 0, new EE.Rect(0, 0, this.worldWidth, this.worldHeight));
    this._camera = new EE.Camera(this, 0, 0, 1);
    this._renderer = new EE.GraphicRenderer(this);
    this._keyboardController = new EE.KeyboardController(this);
    this._lastFrameUpdate = new Date();
    this._deltaTime = 0;
};

EE.Game.prototype._tryCall = function(callable) {
    if(typeof callable === "function") {
        (callable.bind(this))();
    }
};

EE.Game.prototype._init = function() {
    this._canvas.addEventListener("mousedown", this._onClick.bind(this));
    this.cursor.init();
    this.addEntity(this._camera);
    this._tryCall(this._scene.init);
    this._loader.init();
};

EE.Game.prototype._addClickListener = function(callback) {
    this._click_listeners.push(callback);
};

EE.Game.prototype._onClick = function(event) {
    for(var i = 0; i < this._click_listeners.length; i++) {
        (this._click_listeners[i].bind(this))(event);
    }
};

EE.Game.prototype._update = function() {
    var now = new Date();
    this._deltaTime = (now - this._lastFrameUpdate) / 1000;
    this._lastFrameUpdate = now;

    this._tryCall(this._scene.preUpdate);
    this._quadtree.clear();
    for(var i = 0; i < this._entities.length; i++) {
        var ent_type = this._entities[i].type;
        if(typeof ent_type == "undefined" || ent_type == EE.EntityType.STATIC) {
                continue;
        }
        if(ent_type == EE.EntityType.ENTITY || ent_type == EE.EntityType.RENDERABLE ) {
            this._quadtree.insert(this._entities[i]);
        }
        
        if(ent_type == EE.EntityType.UPDATABLE || ent_type == EE.EntityType.ENTITY) {
            this._entities[i].update(this._deltaTime);
        }
    }
    this._tryCall(this._scene.update);
};


EE.Game.prototype._render = function() {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.beginPath();

    this._tryCall(this._scene.prerender);

    var toRender = this.getEntitiesInBounds(this.getCamera().bounds);
    for(var i = 0; i < toRender.length; i++) {
        toRender[i].render();
    }
    this._tryCall(this._scene.render);
    this._tryCall(this._scene.postrender);
    this._context.closePath();
};

EE.Game.prototype._loop = function() {
    this._update();
    this._render();
    window.requestAnimationFrame(this._loop.bind(this));
};

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
};

EE.Game.prototype.run = function() {
    this._init();
    // Wait until all assets are loaded before starting the loop
    this._loader.load().then(() => {
        this._loop();
    });
};

EE.Game.prototype.loadTexture = function(id, src) {
    this._loader.preloadTexture(id, src);
};

EE.Game.prototype.addEntity = function(entity) {
    this._entities.push(entity);
    return entity;
};

EE.Game.prototype.removeEntity = function(entity) {
    var i = this._entities.indexOf(entity);
    if(i !== -1) {
        this._entities.splice(i, 1);
    }
};

EE.Game.prototype.addSprite = function(text_id, x, y, width, height, z_index) {
    var _spr = new EE.Sprite(this, text_id, x, y, width, height, z_index);
    this._entities.push(_spr);
    this._orderEntitiesZIndex();
    return _spr;
};

EE.Game.prototype.addBox = function(x, y, width, height, color) {
    var box = new EE.Box(this, new EE.Rect(x, y, width, height), color);
    return this.addEntity(box);
};

EE.Game.prototype.addTimer = function(delay, callback, repeat, interval) {
    return new EE.Timer(this, delay, callback, repeat, interval);
};

EE.Game.prototype.setBackground = function(color) {
    this._canvas.style.backgroundColor = color;
};

EE.Game.prototype.click = function(callback) {
    this._addClickListener(callback);
};

EE.Game.prototype.getEntities = function(filterType) {
    if(typeof filterType != "undefined") {
        return this._entities.filter((elem) => { return elem instanceof filterType } );
    }
    return this._entities;
};

EE.Game.prototype.getTexture = function(text_id) {
    return this._loader.getTexture(text_id);
};

EE.Game.prototype.getEntitiesInBounds = function(bounds, except) {
    var list = this._quadtree.retrieve(bounds);
    if(typeof except !== "undefined") {
        return list.filter(function(item) {
            return item != except;
        });
    }
    return list;
};

EE.Game.prototype.getCamera = function() {
    return this._camera;
};

EE.Game.prototype.getRenderer = function() {
    return this._renderer;
};

EE.Game.prototype.isDown = function(keyCode) {
    return this._keyboardController.pressed(keyCode);
};