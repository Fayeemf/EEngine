EE.Rect = function (x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

EE.Rect.prototype.left = function () {
  return this.x;
};

EE.Rect.prototype.right = function () {
  return this.x + this.width;
};

EE.Rect.prototype.bottom = function () {
  return this.y + this.height;
};

EE.Rect.prototype.top = function () {
  return this.y;
};