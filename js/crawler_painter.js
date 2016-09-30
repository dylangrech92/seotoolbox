const crawler_painter = {

    containers: [],

    /**
     * Create a result table for the provided tests
     *
     * @param {string} name
     * @param {string} title
     * @param {Array} headers
     * @return {jQuery}
     */
    create: function(name, title, headers){
        var container       = $('<div class="infobox" id="'+name+'"></div>'),
            header          = $('<div class="header clearfix"></div>'),
            count           = $('<div class="count left"></div>'),
            export_button   = $('<div class="icon export glyphicon glyphicon-export right"></div>').hide(),
            toggle_button   = $('<div class="icon toggle glyphicon glyphicon-arrow-down right"></div>').hide(),
            title_bar       = $('<h2 class="left">'+title+'</h2>'),
            table_cont      = $('<div class="tableCont" style="display:none;"></div>'),
            thead           = $('<tr></tr>'),
            table           = $('<table class="table table-hover table-condensed"></table>').append(['<thead></thead>', '<tbody></tbody>']);

        for(var h in headers) thead.append('<th>'+headers[h]+'</th>');
        table.find('thead').append(thead);

        header.append([count, title_bar, toggle_button, export_button]);
        table_cont.append(table);
        container.append([header, table_cont]);

        toggle_button.click(function(){
            crawler.event_handler.trigger('TOGGLED', [name]);
            var $this   = $(this),
                css     = ($this.hasClass('glyphicon-arrow-down')) ? 'glyphicon-arrow-up' : 'glyphicon-arrow-down';
            $this.parents('.infobox').find('.tableCont').slideToggle();
            $this.removeClass('glyphicon-arrow-up glyphicon-arrow-down');
            $this.addClass(css);
        });

        export_button.click(function(){
            crawler.event_handler.trigger('BEFORE_EXPORT', [name]);
            var $this       = $(this),
                rows        = $this.parents( '.infobox' ).first().find( 'table tr' ),
                csvContent  = "data:text/csv;charset=utf-8,";

            $.each( rows, function(){
                var item = [];
                $.each( $(this).find( 'th, td' ), function(){ item.push( $(this).text() ); });
                csvContent += item.join(',') + "\n";
            });

            var link = document.createElement( 'a' );
            link.setAttribute( 'href', encodeURI( csvContent ) );
            link.setAttribute( 'download', name + '.csv' );
            link.click();
            crawler.event_handler.trigger('AFTER_EXPORT', [name]);
        });

        this.containers.push({'name': name, 'container': container});
        return container;
    },

    /**
     * Add a row of data to the container which matches
     * the name provided
     *
     * @param {string} name
     * @param {Array} data
     * @return undefined
     */
    add_row: function(name, data){
        var cont    = this.get_container_by_name(name),
            table   = cont.find('tbody'),
            row     = $('<tr></tr>').appendTo(table),
            len     = table.find('tr').length;

        for(var d in data) row.append($('<td/>').append(data[d]));

        // Show icons if we have items
        if( len > 0 ){
            cont.find('.icon').fadeIn();
        }

        cont.find('.count').html(len);
        return this.set_type_by_data(name);
    },

    /**
     * Update the type of container named cont according to it's data
     *
     * @param {string} name
     * @return {undefined}
     */
    set_type_by_data: function(name){
        var cont = this.get_container_by_name(name);
        if( cont.find('td div.alert-danger').length > 0 ) this.set_type(name, 'error');
        else if( cont.find('td div.alert-warning').length > 0 ) this.set_type(name, 'warning');
        else if( cont.find('td div.alert-info').length > 0 ) this.set_type(name, 'info');
        else if( cont.find('td div.alert-success').length > 0 ) this.set_type(name, 'success');
        return undefined;
    },

    /**
     * Create a status field to be used in the report rows
     *
     * @param {string} type
     * @param {string} text
     * @return {jQuery}
     */
    create_status: function(type, text){
        var ret = $('<div class="status-text alert"></div>');
        switch(type){
            case 'info':
                ret.addClass('alert-info');
                ret.append('<i class="glyphicon glyphicon-info-sign">&nbsp;</i>');
                break;

            case 'error':
                ret.addClass('alert-danger');
                ret.append('<i class="glyphicon glyphicon-exclamation-sign">&nbsp;</i>');
                break;

            case 'success':
                ret.addClass('alert-success');
                ret.append('<i class="glyphicon glyphicon-ok-sign">&nbsp;</i>');
                break;

            case 'warning':
                ret.addClass('alert-warning');
                ret.append('<i class="glyphicon glyphicon-warning-sign">&nbsp;</i>');
                break;
            default: return undefined;
        }
        ret.append(text);
        return ret;
    },

    /**
     * Return the container matching the provided name
     *
     * @param {string} name
     * @return {jQuery|undefined}
     */
    get_container_by_name: function(name){
        for(var c in this.containers) if(this.containers[c]['name'] == name) return this.containers[c]['container'];
        return undefined;
    },

    /**
     * Set the type of the test so it's colour changes according
     *
     * @param {string} name
     * @param {string} type
     * @return undefined
     */
    set_type: function(name, type){
        var cont = this.get_container_by_name(name);
        cont.removeClass('blue red green yellow purple');

        switch(type){
            case 'info': return cont.addClass('blue');
            case 'error': return cont.addClass('red');
            case 'success': return cont.addClass('green');
            case 'warning': return cont.addClass('yellow');
            default: return cont.addClass('purple');
        }
    },

    /**
     * Update the header stats
     */
    update_header: function(){
        $('#leftcount').html(crawler.que.length);
        $('#donecount').html(crawler.tested.length);

        if(crawler.que.length > 0 ) $('#analyzestatus').html('Analyzing');
        else if(crawler.que.length < 1 && crawler.tested.length > 0) $('#analyzestatus').html('Finished');
    },

    /**
     * Returns a link out of the passed url
     *
     * @param {string} url
     * @param {string|undefined} anchor
     * @returns {string}
     */
    create_link: function(url, anchor){
        anchor = (anchor) ? anchor : url;
        return '<a class="btn btn-link" href="'+url+'" title="'+anchor+'" target="_blank" rel="nofollow">'
            +'<span class="glyphicon glyphicon-new-window">&nbsp;</span>'+
            ((anchor.length > 29) ? anchor.substr(0, 27) + '...' : anchor)
            +'</a>';
    },

    /**
     * Initialize the painter
     */
    init:function(){
        for(var c in this.containers) $('#results_container').append(this.containers[c]['container']);
        crawler.event_handler.on('CRAWL_FINISHED', this.update_header);
    }
};
