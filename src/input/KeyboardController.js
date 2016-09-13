EE.KeyboardController = function(game) {
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
}