EE.Cursor = function(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
};

EE.Cursor.prototype.init = function() {
    this.game._canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
};

EE.Cursor.prototype._onMouseMove = function(event) {
    var rect = canvas.getBoundingClientRect();
    this.x = event.clientX - rect.left,
    this.y = event.clientY - rect.top
};

