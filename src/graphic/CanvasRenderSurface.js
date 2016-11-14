EE.CanvasRenderSurface = function (canvas) {
  this._canvas = canvas;
  this._context = canvas.getContext("2d");
};

EE.CanvasRenderSurface.prototype.getDrawingContext = function() {
  return this._context;
};

EE.CanvasRenderSurface.prototype.getSurfaceWidth = function() {
  return this._canvas.width;
};

EE.CanvasRenderSurface.prototype.getSurfaceHeight = function() {
  return this._canvas.height;
};

EE.CanvasRenderSurface.prototype.setBackgroundColor = function(color) {
  this._canvas.style.backgroundColor = color;
  return this._canvas;
};

EE.CanvasRenderSurface.prototype.addEventListener = function(args) {
  this._canvas.addEventListener.apply(this._canvas, arguments);
  return this._canvas;
};

EE.CanvasRenderSurface.prototype.beginDraw = function() {
  this._context.clearRect(0, 0, this.getSurfaceWidth(), this.getSurfaceHeight());
  this._context.beginPath();
};

EE.CanvasRenderSurface.prototype.endDraw = function() {
  this._context.closePath();
};