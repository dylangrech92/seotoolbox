const crawler_event_handler = {

    events : {},

    /**
     * Trigger event callback and pass on the data
     *
     * @param {string} event
     * @param {*} data
     * @returns {undefined}
     */
    trigger: function(event, data){
        if(this.events.hasOwnProperty(event))
            for(var e in this.events[event]) this.events[event][e].apply(this, data);
        return undefined;
    },

    /**
     * Register callback on action
     *
     * @param {string} event
     * @param {function} callback
     * @returns {undefined}
     */
    on: function(event, callback){
        if(!this.events.hasOwnProperty(event)) this.events[event] = [];
        this.events[event].push(callback);
        return undefined;
    },
};
