EE.CanvasRenderSurface = function (canvas) {
  this._canvas = canvas;
  this._context = canvas.getContext("2d");
  this._cursor = new EE.Cursor(this._canvas);
  this.default_stroke_color = "black";
  this.default_fill_color = "black";
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

EE.CanvasRenderSurface.prototype.getCursor = function() {
  return this._cursor;
};

EE.CanvasRenderSurface.prototype.drawImage = function(src, x, y, width, height) {
  this._context.drawImage(src, x, y, width, height);
};

EE.CanvasRenderSurface.prototype.drawImagePart = function(src,sx,sy,swidth,sheight,x,y,width,height) {
  this._context.drawImage(src, sx,sy,swidth,sheight,x,y,width,height);
};

EE.CanvasRenderSurface.prototype.drawRectangle = function(x, y, width, height, color) {
  this._context.save();
  this._context.strokeStyle = color || this.default_stroke_color;
  this._context.strokeRect(x, y, width, height);
  this._context.restore();
};

EE.CanvasRenderSurface.prototype.fillRectangle = function(x, y, width, height, color) {
  this._context.save();
  this._context.fillStyle = color || this.default_fill_color;
  this._context.fillRect(x, y, width, height);
  this._context.restore();
};

EE.CanvasRenderSurface.prototype.drawString = function(txt, x, y) {
  // TODO : implementation
};