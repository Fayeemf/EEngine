EE.MathUtils = function() {

};

EE.MathUtils.contains = function(a, b) {
    return (a.x < b.x && a.y < b.y &&
            a.x + a.width > b.x  &&
            a.y + a.height > b.y);
};

EE.MathUtils.intersects = function(a, b) {
    return !(b.x > (a.x + a.width) || 
        (b.x + b.width) < a.x || 
        b.y > (a.y + a.height) ||
        (b.y + b.height) < a.y);
};