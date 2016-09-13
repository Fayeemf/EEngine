var game = new EE.game(document.getElementById("canvas"), function() {
    var _this = this;

    this.init = function() {
        this.loadTexture(new EE.Texture("grass", "http://www.textures.com/system/gallery/photos/Nature/Grass/50182/Grass0130_1_270.jpg"));
        this.loadTexture(new EE.Texture("water", "http://www.sketchuptextureclub.com/public/texture_d/0035-pool-water-texture-seamless-hr.jpg"));

        this.setBackground("grey");
        this.box = this.addBox(100,0,20,20);

        this.addTimer(1000, () => {
            var x = Math.random() * this.worldWidth;
            var y = Math.random() * this.worldHeight;
            var b = this.addSprite("grass", x, y, 20, 20);
        }, true, 1000);
        this._quadtree.split();
    }

    this.update = function() {
        for(var i = 0; i < this._entities.length; i++) {
            if (this._entities[i] instanceof EE.Sprite) {
                this._entities[i].text_id = "grass";
            }
        }

        var newPos = this.getCamera().toWorldPoint({x: this.mouseX, y: this.mouseY});

        this.box.x = newPos.x - this.box.width;
        this.box.y = newPos.y - this.box.height;
        
        var spr = this.getEntitiesInBounds(this.box.getBounds());
        for(var i = 0; i < spr.length; i++) {
            if (spr[i] instanceof EE.Sprite) {
                spr[i].text_id = "water";
            }
        }

        if(this.isDown(38)) {
            //up
            this.getCamera().moveOffset({x: 0, y:-10});
        }
        if(this.isDown(40)) {
            //down
            this.getCamera().moveOffset({x: 0, y:10});
        }
        if(this.isDown(37)) {
            //left
            this.getCamera().moveOffset({x: -10, y:0});
        }
        if(this.isDown(39)) {
            //right
            this.getCamera().moveOffset({x: 10, y:0});
        }
    }

    this.render = function() {
        
    }
});