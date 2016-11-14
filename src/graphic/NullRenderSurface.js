EE.NullRenderSurface = function (width, height) {
  this.width = width;
  this.height = height;
  this._context = null;
};

EE.NullRenderSurface.prototype.getDrawingContext = function() {
  return this._context;
};

EE.NullRenderSurface.prototype.getSurfaceWidth = function() {
  return this.width;
};

EE.NullRenderSurface.prototype.getSurfaceHeight = function() {
  return this.height;
};

EE.NullRenderSurface.prototype.setBackgroundColor = function(color) {
  return this;
};

EE.NullRenderSurface.prototype.addEventListener = function(args) {
  return this;
};

EE.NullRenderSurface.prototype.beginDraw = function() {
};

EE.NullRenderSurface.prototype.endDraw = function() {
};