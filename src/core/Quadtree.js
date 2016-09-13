EE.Quadtree = function(game, level, bounds, max_objects, max_levels) {
    this.max_objects = max_objects || 2;
    this.max_levels = max_levels || 10;
    this.game = game;
    this.level = level;
    this.bounds = bounds;
    this.objects = [];
    this.nodes = [];

}

EE.Quadtree.prototype.clear = function() {
    this.objects = [];
    for(var i = 0; i < this.nodes.length; i++) {
        this.nodes[i].clear();
        if( typeof this.nodes[i] !== 'undefined' ) {
            this.nodes[i].clear();
        }
    }
    this.nodes = [];
}

EE.Quadtree.prototype.split = function() {
    var subWidth = Math.round(this.bounds.width / 2);
    var subHeight = Math.round(this.bounds.height / 2);
    var x = Math.round(this.bounds.x);
    var y = Math.round(this.bounds.y);

    this.nodes[0] = new EE.Quadtree(this.game, this.level+1, new EE.Rect(x + subWidth, y, subWidth, subHeight));
    this.nodes[1] = new EE.Quadtree(this.game, this.level+1, new EE.Rect(x, y, subWidth, subHeight));
    this.nodes[2] = new EE.Quadtree(this.game, this.level+1, new EE.Rect(x, y + subHeight, subWidth, subHeight));
    this.nodes[3] = new EE.Quadtree(this.game, this.level+1, new EE.Rect(x + subWidth, y + subHeight, subWidth, subHeight));
}


EE.Quadtree.prototype.renderDebug = function() {
    var transformed = this.game._camera.toScreen(this.bounds);
    this.game._renderer.drawRectangle(transformed.x, transformed.y, transformed.width, transformed.height);
    for(var i = 0; i < this.nodes.length; i++) {
        this.nodes[i].renderDebug();
    }
}

EE.Quadtree.prototype.getIndex = function(rect) {
    var index = -1;
    var verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
    var horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

    var isTopQuadrant = (rect.y < horizontalMidpoint && rect.y + rect.height < horizontalMidpoint);
    var isBottomQuadrant = (rect.y > horizontalMidpoint);

    // Object can completely fit within the left quadrants
    if(rect.x < verticalMidpoint && rect.x + rect.width < verticalMidpoint) {
        if(isTopQuadrant) {
            index = 1;
        } else if(isBottomQuadrant) {
            index = 2;
        }
    } else if(rect.x > verticalMidpoint) {
        if(isTopQuadrant) {
            index = 0;
        } else if(isBottomQuadrant) {
            index = 3;
        }
    }
    return index;
}

EE.Quadtree.prototype.insert = function(obj) {
    var i = 0;
    var index;

    if(typeof this.nodes[0] !== 'undefined') {
        index = this.getIndex(obj.bounds);

        if(index !== -1) {
            this.nodes[index].insert(obj);
            return;
        } 
    }

    this.objects.push(obj);

    if(this.objects.length > this.max_objects  && this.level < this.max_levels ) {
        if(typeof this.nodes[0] === 'undefined') {
            this.split();
        }
        
        while(i < this.objects.length) {
            index = this.getIndex(this.objects[i].bounds);
            if(index !== -1) {
                this.nodes[index].insert(this.objects.splice(i, 1)[0]);
            } else {
                i++;
            }
        }
    }
}

EE.Quadtree.prototype.retrieve = function(rect) {
    var ret_obj = this.objects;

    if( typeof this.nodes[0] !== 'undefined' ) {
        var index = this.getIndex(rect);
        if(index !== -1) {
            ret_obj = ret_obj.concat(this.nodes[index].retrieve(rect));
        } else {
            for(var i=0; i < this.nodes.length; i++) {
                ret_obj = ret_obj.concat(this.nodes[i].retrieve(rect));
            }
        }
    }
    
    return ret_obj;
}
