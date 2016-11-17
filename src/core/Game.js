EE.Game = function (renderSurface, obj) {
  this._construct(renderSurface, obj);
};

EE.Game.prototype._construct = function (renderSurface, obj) {
  this.clientWidth = renderSurface.getSurfaceWidth();
  this.clientHeight = renderSurface.getSurfaceHeight();
  this.worldWidth = obj.worldWidth || this.clientWidth;
  this.worldHeight = obj.worldHeight || this.clientHeight;

  this._loader = new EE.Loader();
  this._renderSurface = renderSurface;
  this._context = this._renderSurface.getDrawingContext();
  this._scene = typeof obj == "function" ? new obj() : obj;
  this._click_listeners = [];
  this._entities = [];
  this._quadtree = new EE.Quadtree(this, 0, new EE.Rect(0, 0, this.worldWidth, this.worldHeight));
  this._camera = new EE.Camera(this, 0, 0, 1);
  this._is_node_context = typeof window === "undefined";
  this._keyboardController = new EE.KeyboardController(this);
  this._lastFrameUpdate = new Date();
  this._deltaTime = 0;
};

EE.Game.prototype._init = function () {
  this._renderSurface.addEventListener("mousedown", this._onClick.bind(this));
  this.addEntity(this._camera);
  EE.Utils.tryCall(this, this._scene.init);
  this._loader.init();
};

/**
 * Add a listener that will be called whenever a click event occur on the rendering surface
 * @param callback
 * @private
 */
EE.Game.prototype._addClickListener = function (callback) {
  this._click_listeners.push(callback);
};

/**
 * Calls every click event binded on the game
 * @param event {Object}
 * @private
 */
EE.Game.prototype._onClick = function (event) {
  for (var i = 0; i < this._click_listeners.length; i++) {
    (this._click_listeners[i].bind(this))(event);
  }
};

/**
 * Insert entities in the quadtree then update them, calls the scene's update method
 * @private
 */
EE.Game.prototype._update = function () {
  var now = new Date();
  this._deltaTime = (now - this._lastFrameUpdate) / 1000;
  this._lastFrameUpdate = now;

  EE.Utils.tryCall(this, this._scene.preUpdate);
  this._quadtree.clear();
  for (var i = 0; i < this._entities.length; i++) {
    var ent_type = this._entities[i].type;
    if (typeof ent_type === "undefined" || ent_type === EE.EntityType.STATIC) {
      continue;
    }
    if (ent_type === EE.EntityType.ENTITY || ent_type === EE.EntityType.RENDERABLE || ent_type === EE.EntityType.COLLIDABLE) {
      this._quadtree.insert(this._entities[i]);
    }
  }

  // We have to make sure every entities are in the quadtree before updating them
  for (var i = 0; i < this._entities.length; i++) {
    var ent_type = this._entities[i].type;
    if (ent_type === EE.EntityType.UPDATABLE || ent_type === EE.EntityType.ENTITY) {
      this._entities[i].update(this._deltaTime);
    }
  }
  EE.Utils.tryCall(this, this._scene.update);
};

/**
 * Render entities and call the scene's prerender and render
 * @private
 */
EE.Game.prototype._render = function () {
  this._renderSurface.beginDraw();

  EE.Utils.tryCall(this, this._scene.prerender);

  var entities = this.getEntitiesInBounds(this.getCamera().bounds);
  for (var i = 0; i < entities.length; i++) {
    var ent_type = entities[i].type;

    if (typeof ent_type === "undefined" || ent_type === EE.EntityType.COLLIDABLE) {
      continue;
    }

    entities[i].render();
  }
  EE.Utils.tryCall(this, this._scene.render);
  EE.Utils.tryCall(this, this._scene.postrender);
  this._renderSurface.endDraw();
};

/**
 * Main loop for the game, calls update and calls render if it's not in a node context
 * @private
 */
EE.Game.prototype._loop = function () {
  this._update();
  if(!this._is_node_context) {
    this._render();
    window.requestAnimationFrame(this._loop.bind(this));
  } else {
    setTimeout(this._loop.bind(this), 10)
  }
};

/**
 * Order every entities according to their z_index
 * @private
 */
EE.Game.prototype._orderEntitiesZIndex = function () {
  this._entities.sort(function (a, b) {
    if (a.z_index < b.z_index) {
      return 1;
    }
    if (a.z_index > b.z_index) {
      return -1;
    }
    return 0;
  });
};

/**
 * Initialize the game and load assets
 */
EE.Game.prototype.run = function () {
  this._init();
  // Wait until all assets are loaded before starting the loop
  this._loader.load().then(function () {
    this._loop();
  }.bind(this));
};

/**
 * Adds a texture to be loader by the game's loader
 * @param id {String} Unique identifier for the texture
 * @param src {String}
 */
EE.Game.prototype.loadTexture = function (id, src) {
  this._loader.preloadTexture(id, src);
};

/**
 * Adds an entity to the game
 * @param entity {Object} - Must contain a `type` field (EE.EntityType)
 * @returns {*} The added entity
 */
EE.Game.prototype.addEntity = function (entity) {
  if (typeof entity.type === "undefined") {
    console.log(entity);
    throw "Can't add an entity without a 'type' attribute defined";
  }
  this._entities.push(entity);
  return entity;
};

/**
 * Add multiple entities at once
 * @param entities {Array.<T>} - An array of entities objects
 * @returns {*}
 */
EE.Game.prototype.addEntities = function (entities) {
  Array.prototype.forEach.call(entities, function (entity) {
    this.addEntity(entity);
  }.bind(this));
  return entities;
};

/**
 * Remove an entity from the game
 * @param entity {Object}
 */
EE.Game.prototype.removeEntity = function (entity) {
  var i = this._entities.indexOf(entity);
  if (i !== -1) {
    this._entities.splice(i, 1);
  }
};

/**
 * Add a Sprite to the game
 * @param text_id {String} - The texture id to be used for the sprite, must be loaded first
 * @param x {Number} - Initial X position for the sprite
 * @param y {Number} - Initial Y position for the sprite
 * @param width {Number} - Width of the sprite
 * @param height {Number} - Width of the sprite
 * @param z_index
 * @returns {EE.Sprite}
 */
EE.Game.prototype.addSprite = function (text_id, x, y, width, height, z_index) {
  var _spr = new EE.Sprite(this, text_id, x, y, width, height, z_index);
  this._entities.push(_spr);
  this._orderEntitiesZIndex();
  return _spr;
};

/**
 * Add a simple Box to be rendered
 * @param x
 * @param y
 * @param width
 * @param height
 * @param color
 * @returns {*}
 */
EE.Game.prototype.addBox = function (x, y, width, height, color) {
  var box = new EE.Box(this, new EE.Rect(x, y, width, height), color);
  return this.addEntity(box);
};

/**
 * Add a timer
 * @param delay {Number} - Time before the callback is called
 * @param callback {Function} - Callback function
 * @param repeat {Boolean} - Whether the timer should be repeated
 * @param interval {Number} - Time before the callback is called between each repeat
 * @returns {EE.Timer}
 */
EE.Game.prototype.addTimer = function (delay, callback, repeat, interval) {
  return new EE.Timer(this, delay, callback, repeat, interval);
};

/**
 * Sets the background color of the rendering surface
 * @param color {String} - Color
 */
EE.Game.prototype.setBackground = function (color) {
  this._renderSurface.setBackgroundColor(color);
};

/**
 * Add a click listener
 * @param callback
 */
EE.Game.prototype.click = function (callback) {
  this._addClickListener(callback);
};

/**
 * Gets all entities currently in the game
 * @param filterType {Object} - Optional, If set it will only return entities of the said type
 * @returns {*}
 */
EE.Game.prototype.getEntities = function (filterType) {
  if (typeof filterType != "undefined") {
    return this._entities.filter(function (elem) {
      return elem instanceof filterType
    }.bind(this));
  }
  return this._entities;
};

/**
 * Returns the texture associated to a texture id
 * @param text_id {String}
 */
EE.Game.prototype.getTexture = function (text_id) {
  return this._loader.getTexture(text_id);
};

/**
 * Get entities currently in the specified bounds
 * @param bounds {Object} - An object containing a x,y,width and height property
 * @param except {Object} - If set, this object will not be returned from the list
 * @returns {Array.<T>|*}
 */
EE.Game.prototype.getEntitiesInBounds = function (bounds, except) {
  var list = this._quadtree.retrieve(bounds);

  if (typeof except !== "undefined") {
    return list.filter(function (item) {
      return item !== except;
    });
  }
  return list;
};

/**
 * Gets the camera of the game
 * @returns {EE.Camera}
 */
EE.Game.prototype.getCamera = function () {
  return this._camera;
};

/**
 *
 * @returns {*} The current rendering surface of the game
 */
EE.Game.prototype.getRendererSurface = function () {
  return this._renderSurface;
};

EE.Game.prototype.getCursor = function () {
  return this._renderSurface.getCursor();
};

/**
 * Return True if the key is currently down
 * @param keyCode {EE.Keys}
 */
EE.Game.prototype.isDown = function (keyCode) {
  return this._keyboardController.pressed(keyCode);
};