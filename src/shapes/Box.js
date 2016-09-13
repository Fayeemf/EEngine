EE.Box = function(game, bounds, color) {
    this.game = game;
    this.bounds = bounds;
    this.color = color;
}

EE.Box.prototype.render = function() {
    var transformed = this.game._camera.toScreen(this.bounds);
    this.game._renderer.drawRectangle(transformed.x, transformed.y, transformed.width, transformed.height, this.color);
}

EE.Box.prototype.update = function(dt) {
    return;
}

EE.Box.prototype.setColor = function(color) {
    // TODO : Input validation for color
    this.color = color;
}