EE.Vector2 = function(x, y) {
    this.x = x;
    this.y = y;
};

EE.Vector2.lerp = function(a, b, amt) {
    var nx = a.x+(b.x-a.x)*amt;
    var ny = a.y+(b.y-a.y)*amt;
    return {x:nx,  y:ny};
};