var EE = {
    
};EE.Animator = function(game, obj, path) {
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
};EE.Camera = function(game, x, y, scale) {
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
};EE.Game = function(canvas, obj) {
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
};EE.Quadtree = function(game, level, bounds, max_objects, max_levels) {
    this.max_objects = max_objects || 2;
    this.max_levels = max_levels || 10;
    this.game = game;
    this.level = level;
    this.bounds = bounds;
    this.objects = [];
    this.nodes = [];
}

EE.Quadtree.prototype.clear = function() {
    this.objects = [];
    for(var i = 0; i < this.nodes.length; i++) {
        this.nodes[i].clear();
        if( typeof this.nodes[i] !== 'undefined' ) {
            this.nodes[i].clear();
        }
    }
    this.nodes = [];
}

EE.Quadtree.prototype.split = function() {
    var subWidth = Math.round(this.bounds.width / 2);
    var subHeight = Math.round(this.bounds.height / 2);
    var x = Math.round(this.bounds.x);
    var y = Math.round(this.bounds.y);

    this.nodes[0] = new EE.Quadtree(this.game, this.level+1, new EE.Rect(x + subWidth, y, subWidth, subHeight));
    this.nodes[1] = new EE.Quadtree(this.game, this.level+1, new EE.Rect(x, y, subWidth, subHeight));
    this.nodes[2] = new EE.Quadtree(this.game, this.level+1, new EE.Rect(x, y + subHeight, subWidth, subHeight));
    this.nodes[3] = new EE.Quadtree(this.game, this.level+1, new EE.Rect(x + subWidth, y + subHeight, subWidth, subHeight));
}


EE.Quadtree.prototype.renderDebug = function() {
    var transformed = this.game._camera.toScreen(this.bounds);
    this.game._renderer.drawRectangle(transformed.x, transformed.y, transformed.width, transformed.height);
    for(var i = 0; i < this.nodes.length; i++) {
        this.nodes[i].renderDebug();
    }
}

EE.Quadtree.prototype.getIndex = function(rect) {
    var index = -1;
    var verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
    var horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

    var isTopQuadrant = (rect.y < horizontalMidpoint && rect.y + rect.height < horizontalMidpoint);
    var isBottomQuadrant = (rect.y > horizontalMidpoint);

    // Object can completely fit within the left quadrants
    if(rect.x < verticalMidpoint && rect.x + rect.width < verticalMidpoint) {
        if(isTopQuadrant) {
            index = 1;
        } else if(isBottomQuadrant) {
            index = 2;
        }
    } else if(rect.x > verticalMidpoint) {
        if(isTopQuadrant) {
            index = 0;
        } else if(isBottomQuadrant) {
            index = 3;
        }
    }
    return index;
}

EE.Quadtree.prototype.insert = function(obj) {
    var i = 0;
    var index;

    if(typeof this.nodes[0] !== 'undefined') {
        index = this.getIndex(obj.bounds);

        if(index !== -1) {
            this.nodes[index].insert(obj);
            return;
        } 
    }

    this.objects.push(obj);

    if(this.objects.length > this.max_objects  && this.level < this.max_levels ) {
        if(typeof this.nodes[0] === 'undefined') {
            this.split();
        }
        
        while(i < this.objects.length) {
            index = this.getIndex(this.objects[i].bounds);
            if(index !== -1) {
                this.nodes[index].insert(this.objects.splice(i, 1)[0]);
            } else {
                i++;
            }
        }
    }
}

EE.Quadtree.prototype.retrieve = function(rect) {
    var ret_obj = this.objects;

    if( typeof this.nodes[0] !== 'undefined' ) {
        var index = this.getIndex(rect);
        if(index !== -1) {
            ret_obj = ret_obj.concat(this.nodes[index].retrieve(rect));
        } else {
            for(var i=0; i < this.nodes.length; i++) {
                ret_obj = ret_obj.concat(this.nodes[i].retrieve(rect));
            }
        }
    }
    
    return ret_obj;
}
;EE.Rect = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
};EE.Vector2 = function(x, y) {
    this.x = x;
    this.y = y;
}

EE.Vector2.lerp = function(a, b, amt) {
    var nx = a.x+(b.x-a.x)*amt;
    var ny = a.y+(b.y-a.y)*amt;
    return {x:nx,  y:ny};
};EE.GraphicRenderer = function(game) {
    this.game = game;
    this.default_stroke_color = "black";
    this.default_fill_color = "black";
}

EE.GraphicRenderer.prototype.drawImage = function(src, x, y, width, height) {
    this.game._context.drawImage(src, x, y, width, height);
}

EE.GraphicRenderer.prototype.drawRectangle = function(x, y, width, height, color) {
    this.game._context.save();
    this.game._context.strokeStyle = color || this.default_stroke_color;
    this.game._context.strokeRect(x, y, width, height);
    this.game._context.restore();
}

EE.GraphicRenderer.prototype.fillRectangle = function(x, y, width, height, color) {
    this.game._context.save();
    this.game._context.fillStyle = color || this.default_fill_color;
    this.game._context.fillRect(x, y, width, height);
    this.game._context.restore();
}

EE.GraphicRenderer.prototype.drawString = function(txt, x, y) {
    // TODO : implementation
};EE.Sprite = function(game, text_id, x, y, width, height, z_index) {
    this.game = game;
    this.text_id = text_id;
    this.bounds = new EE.Rect(x, y, width, height);
    this._colliders = [];
    this.z_index = z_index || 0;
    this.visible = true;
    this.clickable = true;
}

EE.Sprite.prototype.render = function() {
    if(!this.visible) {
        return;
    }
    var texture = this.game._textures[this.text_id];
    var width = this.bounds.width || texture.width;
    var height = this.bounds.height || texture.height;
    var transformed = this.game._camera.toScreen({x:this.bounds.x, y:this.bounds.y, width:width, height:height});
    this.game._renderer.drawImage(texture, transformed.x, transformed.y, transformed.width, transformed.height);
}

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
}

EE.Sprite.prototype.moveTo = function(x, y) {
    this.bounds.x = x;
    this.bounds.y = y;
}

EE.Sprite.prototype.setZ = function(z) {
    this.z_index = z;
    this.game._orderSpritesZIndex();
}

EE.Sprite.prototype.collide = function(other, callback) {
    this._colliders.push(
        {
            "candidate": other,
            "callback": callback,
            "hit": false
        }
    );
}

EE.Sprite.prototype.click = function(callback) {
    this.game._addClickListener((event) => {
        if(this.contains(this.game.getCamera().toWorldPoint({x: event.offsetX, y: event.offsetY})) && this.clickable){
            callback();
        }
    });
}

EE.Sprite.prototype.intersects = function(other) {
    return !(other.left() > this.right() || 
        other.right() < this.left() || 
        other.top() > this.bottom() ||
        other.bottom() < this.top());
}

EE.Sprite.prototype.contains = function(p) {
    return (this.bounds.x < p.x && this.bounds.y < p.y &&
            this.bounds.x + this.bounds.width > p.x  &&
            this.bounds.y + this.bounds.height > p.y);
};EE.Texture = function(id, src) {
    this.id = id;
    this.src = src;
};EE.Cursor = function(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
}

EE.Cursor.prototype.init = function() {
    this.game._canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
}

EE.Cursor.prototype._onMouseMove = function(event) {
    var rect = canvas.getBoundingClientRect();
    this.x = event.clientX - rect.left,
    this.y = event.clientY - rect.top
}

;EE.KeyboardController = function(game) {
    this.game = game;
    this._downKeys = [];

    window.addEventListener("keydown", this._onKeyDown.bind(this));
    window.addEventListener("keyup", this._onKeyUp.bind(this));
}

EE.KeyboardController.prototype._onKeyDown = function(event) {
    if(this.pressed(event.keyCode)) {
        return;
    }
    this._downKeys[event.keyCode] = event.key;
}

EE.KeyboardController.prototype._onKeyUp = function(event) {
    if(this.pressed(event.keyCode)) {
        this._downKeys.splice(event.keyCode, 1);
    }
}

EE.KeyboardController.prototype.pressed = function(keyCode) {
    return typeof(this._downKeys[keyCode]) !== "undefined";
};EE.Keys = {
    A: "A".charCodeAt(0),
    
    B: "B".charCodeAt(0),
    
    C: "C".charCodeAt(0),
    
    D: "D".charCodeAt(0),
    
    E: "E".charCodeAt(0),
    
    F: "F".charCodeAt(0),
    
    G: "G".charCodeAt(0),
    
    H: "H".charCodeAt(0),
    
    I: "I".charCodeAt(0),
    
    J: "J".charCodeAt(0),
    
    K: "K".charCodeAt(0),
    
    L: "L".charCodeAt(0),
    
    M: "M".charCodeAt(0),
    
    N: "N".charCodeAt(0),
    
    O: "O".charCodeAt(0),
    
    P: "P".charCodeAt(0),
    
    Q: "Q".charCodeAt(0),
    
    R: "R".charCodeAt(0),
    
    S: "S".charCodeAt(0),
    
    T: "T".charCodeAt(0),
    
    U: "U".charCodeAt(0),
    
    V: "V".charCodeAt(0),
    
    W: "W".charCodeAt(0),
    
    X: "X".charCodeAt(0),
    
    Y: "Y".charCodeAt(0),
    
    Z: "Z".charCodeAt(0),
    
    ZERO: "0".charCodeAt(0),
    
    ONE: "1".charCodeAt(0),
    
    TWO: "2".charCodeAt(0),
    
    THREE: "3".charCodeAt(0),
    
    FOUR: "4".charCodeAt(0),
    
    FIVE: "5".charCodeAt(0),
    
    SIX: "6".charCodeAt(0),
    
    SEVEN: "7".charCodeAt(0),
    
    EIGHT: "8".charCodeAt(0),
    
    NINE: "9".charCodeAt(0),
    
    NUMPAD_0: 96,
    
    NUMPAD_1: 97,
    
    NUMPAD_2: 98,
    
    NUMPAD_3: 99,
    
    NUMPAD_4: 100,
    
    NUMPAD_5: 101,
    
    NUMPAD_6: 102,
    
    NUMPAD_7: 103,
    
    NUMPAD_8: 104,
    
    NUMPAD_9: 105,
    
    NUMPAD_MULTIPLY: 106,
    
    NUMPAD_ADD: 107,
    
    NUMPAD_ENTER: 108,
    
    NUMPAD_SUBTRACT: 109,
    
    NUMPAD_DECIMAL: 110,
    
    NUMPAD_DIVIDE: 111,
    
    F1: 112,
    
    F2: 113,
    
    F3: 114,
    
    F4: 115,
    
    F5: 116,
    
    F6: 117,
    
    F7: 118,
    
    F8: 119,
    
    F9: 120,
    
    F10: 121,
    
    F11: 122,
    
    F12: 123,
    
    F13: 124,
    
    F14: 125,
    
    F15: 126,
    
    COLON: 186,
    
    EQUALS: 187,
    
    COMMA: 188,
    
    UNDERSCORE: 189,
    
    PERIOD: 190,
    
    QUESTION_MARK: 191,
    
    TILDE: 192,
    
    OPEN_BRACKET: 219,
    
    BACKWARD_SLASH: 220,
    
    CLOSED_BRACKET: 221,
    
    QUOTES: 222,
    
    BACKSPACE: 8,
    
    TAB: 9,
    
    CLEAR: 12,
    
    ENTER: 13,
    
    SHIFT: 16,
    
    CONTROL: 17,
    
    ALT: 18,
    
    CAPS_LOCK: 20,
    
    ESC: 27,
    
    SPACEBAR: 32,
    
    PAGE_UP: 33,
    
    PAGE_DOWN: 34,
    
    END: 35,
    
    HOME: 36,
    
    LEFT: 37,
    
    UP: 38,
    
    RIGHT: 39,
    
    DOWN: 40,
    
    PLUS: 43,
    
    MINUS: 44,
    
    INSERT: 45,
    
    DELETE: 46,
    
    HELP: 47,
    
    NUM_LOCK: 144
};;EE.Box = function(game, bounds, color) {
    this.game = game;
    this.bounds = bounds;
    this.color = color;
}

EE.Box.prototype.render = function() {
    var transformed = this.game._camera.toScreen(this.bounds);
    this.game._renderer.drawRectangle(transformed.x, transformed.y, transformed.width, transformed.height, this.color);
}

EE.Box.prototype.update = function(dt) {
    return;
}

EE.Box.prototype.setColor = function(color) {
    // TODO : Input validation for color
    this.color = color;
};EE.TiledMap = function(game, src, scale) {
    this.game = game;
    this.src = src;
    this.scale = scale;

    this._loadcb = null;
}

EE.TiledMap.prototype.init = function() {
    var xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xhr.onload = () => {this._loaded(xhr); };
    xhr.open("GET", this.src);
    xhr.send();
}

EE.TiledMap.prototype.onLoad = function(callback) {
    if(typeof callback != "function") {
        throw "onLoad callback must be a function, " + typeof callback + " provided";
    }
    this._loadcb = callback;
}

EE.TiledMap.prototype._loaded = function(xhr) {
    var resp = xhr.responseText;
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(resp, "text/xml");
    if(this._loadcb) {
        this._loadcb(resp);
    }
} 
;EE.Guid = function() {
}

EE.Guid.prototype.get = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
;EE.Timer = function(game, delay, callback, repeat, interval) {
    this.delay = (delay >= 1 ? delay : 0);
    this.callback = callback;
    this.repeat = repeat || false;
    this.interval = interval || this.delay;
    this.stopped = false;
    this.game = game;

    this._start_time = new Date();
    this._next_tick = new Date()
    this._next_tick.setSeconds(this._next_tick.getSeconds() + (delay / 1000));
}

EE.Timer.prototype.start = function() {
    this.game.addUpdatable(this);
}

EE.Timer.prototype.update = function() {
    if(this.stopped) {
        return;
    }
    var curr_date = new Date();
    if(curr_date >= this._next_tick) {
        (this.callback.bind(this))();
        if(this.repeat) {
            this._next_tick = curr_date;
            this._next_tick.setSeconds(this._next_tick.getSeconds() + (this.interval / 1000));
        } else {
            this.stop();
        }
    }
}

EE.Timer.prototype.stop = function() {
    this.stopped = true;
    this.game.removeUpdatable(this);
}