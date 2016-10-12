EE.Utils = function() {};

EE.Utils.tryCall = function(thisarg, callable) {
    if(typeof callable === "function") {
        (callable.bind(thisarg))();
    }
};