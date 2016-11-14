EE.KeyboardController = function (game) {
  this.game = game;
  this._keys = [];

  window.addEventListener("keydown", this._onKeyDown.bind(this));
  window.addEventListener("keyup", this._onKeyUp.bind(this));
};

EE.KeyboardController.prototype._onKeyDown = function (event) {
  var key = this._findKey(event.keyCode);
  if (typeof key !== "undefined") {
    key.down = true;
  } else {
    this._keys.push(new EE.KeyInfo(event.keyCode, true));
  }
};

EE.KeyboardController.prototype._findKey = function (keycode) {
  var key = this._keys.filter(function (keyinfo) {
    return keyinfo.keycode == keycode;
  });
  return key[0];
};

EE.KeyboardController.prototype._onKeyUp = function (event) {
  var key = this._findKey(event.keyCode);
  if (typeof key !== "undefined") {
    key.down = false;
  }
};

EE.KeyboardController.prototype.pressed = function (keyCode) {
  var key = this._findKey(keyCode);
  return typeof key !== "undefined" && key.down;
};

EE.KeyInfo = function (keycode, down) {
  this.keycode = keycode;
  this.down = down;
};