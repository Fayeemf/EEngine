EE.TiledMap = function(game, src, scale) {
    this.game = game;
    this.src = src;
    this.scale = scale;

    this._loadcb = null;
}

EE.TiledMap.prototype.init = function() {
    var xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xhr.onload = () => {this._loaded(xhr); };
    xhr.open("GET", this.src);
    xhr.send();
}

EE.TiledMap.prototype.onLoad = function(callback) {
    if(typeof callback != "function") {
        throw "onLoad callback must be a function, " + typeof callback + " provided";
    }
    this._loadcb = callback;
}

EE.TiledMap.prototype._loaded = function(xhr) {
    var resp = xhr.responseText;
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(resp, "text/xml");
    if(this._loadcb) {
        this._loadcb(resp);
    }
} 
