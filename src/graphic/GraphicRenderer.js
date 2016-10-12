EE.GraphicRenderer = function(game) {
    this.game = game;
    this.default_stroke_color = "black";
    this.default_fill_color = "black";
};

EE.GraphicRenderer.prototype.drawImage = function(src, x, y, width, height) {
    this.game._context.drawImage(src, x, y, width, height);
};

EE.GraphicRenderer.prototype.drawImagePart = function(src,sx,sy,swidth,sheight,x,y,width,height) {
    this.game._context.drawImage(src, sx,sy,swidth,sheight,x,y,width,height);
};

EE.GraphicRenderer.prototype.drawRectangle = function(x, y, width, height, color) {
    this.game._context.save();
    this.game._context.strokeStyle = color || this.default_stroke_color;
    this.game._context.strokeRect(x, y, width, height);
    this.game._context.restore();
};

EE.GraphicRenderer.prototype.fillRectangle = function(x, y, width, height, color) {
    this.game._context.save();
    this.game._context.fillStyle = color || this.default_fill_color;
    this.game._context.fillRect(x, y, width, height);
    this.game._context.restore();
};

EE.GraphicRenderer.prototype.drawString = function(txt, x, y) {
    // TODO : implementation
};