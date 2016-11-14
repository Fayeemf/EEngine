EE.Cursor = function(canvas) {
  this._canvas = canvas;
  this.x = 0;
  this.y = 0;
  this._canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
};

EE.Cursor.prototype._onMouseMove = function(event) {
  var rect = this._canvas.getBoundingClientRect();
  this.x = event.clientX - rect.left;
  this.y = event.clientY - rect.top;
};