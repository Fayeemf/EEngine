EE.Timer = function(game, delay, callback, repeat, interval) {
    this.delay = (delay >= 1 ? delay : 0);
    this.callback = callback;
    this.repeat = repeat || false;
    this.interval = interval || this.delay;
    this.stopped = false;

    this._start_time = new Date();
    this._next_tick = new Date()
    this._next_tick.setSeconds(this._next_tick.getSeconds() + (delay / 1000));
}

EE.Timer.prototype.update = function() {
    if(this.stopped) {
        return;
    }
    var curr_date = new Date();
    if(curr_date >= this._next_tick) {
        (this.callback.bind(this))();
        if(this.repeat) {
            this._next_tick = curr_date;
            this._next_tick.setSeconds(this._next_tick.getSeconds() + (this.interval / 1000));
        } else {
            this.stopped = true;
        }
    }
}

EE.Timer.prototype.stop = function() {
    this.stopped = true;
}