EE.GameHost = function(gameWidth, gameHeight) {
  this._construct(new EE.NullRenderSurface(1280, 1200), {});
};

EE.GameHost.prototype = new EE.Game(new EE.NullRenderSurface(1280, 1200), {});