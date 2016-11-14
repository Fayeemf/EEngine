EE.Utils = {};

EE.Utils.tryCall = function (thisarg, callable) {
  if (typeof callable === "function") {
    // Ignoring the two first arguments (this and callable)
    var params = Array.prototype.slice.call(arguments);
    params.shift();
    params.shift();
    callable.apply(thisarg, params);
  }
};