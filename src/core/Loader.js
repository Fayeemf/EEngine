EE.Loader = function () {
  this._promises = [];
  this._textures_load_stack = [];
  this._textures = [];
  this._loaded = false;
};

EE.Loader.prototype.init = function () {
  this.add(this._loadTextures());
};

EE.Loader.prototype.add = function (promise) {
  if (promise instanceof Promise) {
    this._promises.push(promise);
  }
};

EE.Loader.prototype.preloadTexture = function (id, src) {
  if (typeof id == "undefined") {
    throw "Texture id cannot be undefined";
  }
  if (typeof src == "undefined") {
    throw "Source cannot be undefined";
  }
  var exists = this._textures_load_stack.filter(function (elem) {
      return elem.id == id;
    }.bind(this)).length !== 0;
  if (exists) {
    throw "Duplicate texture id : " + id;
  }
  this._textures_load_stack.push(new EE.Texture(id, src));
};

EE.Loader.prototype.getTexture = function (text_id) {
  return this._textures[text_id];
};

EE.Loader.prototype.load = function () {
  return new Promise(function (resolve, reject) {
    Promise.all(this._promises).then(function (val) {
      resolve(true);
      this._loaded = true;
    }.bind(this), function (reason) {
      reject(false);
    }.bind(this));
  }.bind(this));
};

EE.Loader.prototype._loadTextures = function () {
  return new Promise(function (resolve, reject) {
    function load_recus() {
      if (this._textures_load_stack.length > 0) {
        var texture = this._textures_load_stack[this._textures_load_stack.length - 1];
        var img = new Image();
        img.src = texture.src;
        img.onload = function () {
          var index = this._textures_load_stack.indexOf(texture);
          if (index === -1) {
            throw "Texture not found in the load queue";
          }
          this._textures_load_stack.splice(index, 1);
          this._textures[texture.id] = img;
          (load_recus.bind(this))();
        }.bind(this)
      } else {
        resolve("loaded");
      }
    }

    (load_recus.bind(this))();
  }.bind(this));
};