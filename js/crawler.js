const crawler = {

    que             : [],
    tested          : [],
    crawling        : [],
    tests           : [],
    ignore_paths    : [],
    crawl_id        : undefined,
    events          : {},
    linked_from     : {},
    useragent       : 'desktop',

    /**
     * Register a test to run.
     *
     * @param {string} name
     * @param {string} title
     * @param {Array} headers
     * @param {string} callable
     * @returns {boolean}
     * @throws Exception
     */
    regiser_test: function(name, title, headers, callable){
        if(name == undefined || this.get_test_by_name(name)) throw 'Invalid name specified for your test';
        if(title == undefined) throw 'Title not specified';
        if(!(headers instanceof Array) || headers.length < 1) throw 'Headers array is invalid';
        if(typeof callable != 'function') return crawler_painter.create(name, title, headers);
        this.tests.push({name: name, title: title, callback: callable, cont:crawler_painter.create(name, title, headers)});
    },

    /**
     * Return a registered test by name
     *
     * @param {string} name
     * @returns {object|false}
     */
    get_test_by_name: function(name){
        for(var t in this.test) if(this.tests[t]['name'] == name) return this.tests[t];
        return false;
    },

    /**
     * Check if the url passed is valid for crawling, if so and it hasn't
     * been added or crawled before, add it to the que
     *
     * Returns false if failed to add to que
     *
     * @param {string} url
     * @returns {boolean|undefined}
     */
    que_url: function(url){
        var sanitized = this.sanitize(url);
        if( !this.can_crawl(url) || this.que.indexOf(sanitized) > -1 || !this.can_crawl(sanitized)) return false;
        this.que.push(sanitized);
    },

    /**
     *  Clean up a url so it becomes relative and standardized
     *
     * @param {string} url
     * @returns {string}
     */
    sanitize: function(url){
        if(url == undefined) return '';

        url = url
            .replace(/https?:\/\/[^\/]+/i, '')
            .replace(/^\/|\/$/g, '').split('#')[0];

        if( url.slice(-1) == '?' ) url = url.slice(0, -1);
        if( url.length < 1 ) url = '/';

        return url;
    },

    /**
     * Get the domain for the passed url
     *
     * @param {string} url
     * @returns {string}
     */
    get_domain: function(url){
        if( !url ) return '';
        if( url.indexOf("://") > -1 ) return url.split('/')[2].split(':')[0];
        else return url.split('/')[0].split(':')[0];
    },

    /**
     * Checks if the passed url should be ignored or not
     *
     * @param {string} url
     * @returns {boolean}
     */
    ignore_url: function( url ){
        for(var regex in this.ignore_paths) {
            var reg = new RegExp(this.ignore_paths[regex], 'i');
            if( url.match(reg) != null ) return true;
        }
        return false;
    },

    /**
     * Add a path to ignore when crawler
     * Note: Paths can be in regex format
     *
     * @param {string} path
     * @returns {crawler}
     */
    add_ignore_path: function(path){
        this.ignore_paths.push(path);
        return this;
    },

    /**
     * Update all ignore paths to the paths specified
     * Note: Path can be in regex format
     *
     * @param paths
     * @returns {crawler}
     */
    set_ignore_paths: function(paths){
        this.ignore_paths = paths;
        return this;
    },

    /**
     * Sets the crawl id
     *
     * @param crawl_id
     * @returns {crawler}
     */
    set_crawl_id: function(crawl_id){
        this.crawl_id = crawl_id;
        return this;
    },

    /**
     * Does some soft checks to determine if url is a valid candidate for crawling
     *
     * @param {string} url
     * @returns {boolean}
     */
    can_crawl: function(url){
        if(url == undefined) return false;
        return !(this.crawling.indexOf(url) >= 0 || this.tested.indexOf(url) >= 0 ||
                    this.is_file(url) || this.ignore_url(url) || this.is_external(url));
    },

    /**
     * Does a soft check for the url passed and checks if it's a file
     * by checking if it has an extension and if the extension contains 'html'
     *
     * @param {string} url
     * @returns {boolean}
     */
    is_file: function(url){
        var split = this.sanitize( url ).split( '.' );
        return split.length > 1 && split.pop().indexOf( 'html' ) < 0;
    },

    /**
     * Does some soft checking for the url passed to see if it's external
     * Note: If the url is internal but redirects to an external source, we wown't detect it here
     *
     * @param {string} url
     * @returns {boolean}
     */
    is_external: function(url){
        // Starts with / or # or doesn't have :// in it has to be internal
        if( url.length < 1 || url[0] == '/' || url[0] == '#' || url.indexOf('://') < 0 ) return false;

        // If we removed the domain and the url is still the same then it's an internal link without the leading /
        if( url == this.sanitize( url ) ) return false;

        // The domain is the same the domain we're running this script on
        if( this.get_domain( url ) == location.hostname ) return false;

        return true;
    },

    /**
     * Fetch the next url from the que and run the tests on it
     */
    fetch_and_test: function(){
        if( !this.que || this.que.length < 1 || this.que.length < 1 || $.active > 2 ) return false;

        var url = this.que.pop();
        this.crawling.push(url);

        $.ajax({
            url: this.get_proxy( url ), data: { agent: this.useragent }, accepts: 'json', dataType: 'json'
        })
            .done(function( result ) {
                if(result['headers'] && result['body'] && result['body'].toLowerCase().indexOf('<head') >= 0) {
                    if( !crawler.is_external(result['url_fetched']) ) {
                        var fetched_url = crawler.sanitize(result['url_fetched']);
                        if(fetched_url != url){
                            // We hit a redirect but already crawled the destination
                            if(crawler.tested.indexOf(fetched_url) >= 0) return true;
                            url = fetched_url;
                        }

                        var html = $(crawler.strip_img_src(result['body']));
                        crawler.trigger('CRAWL_BEFORE_TESTS', [url]);
                        crawler.fetch_links(html, url);
                        crawler.run_tests(url, html, result['headers'], result['field_data'], result['phrases']);
                        crawler.trigger('CRAWL_AFTER_TESTS', [url]);
                        return true;
                    }

                    crawler.trigger('CRAWL_LOAD_FAILED', [url]);
                }
            })
            .fail( function(){ crawler.trigger('CRAWL_LOAD_FAILED', [url]); })
            .always( function(){
                crawler.trigger('CRAWL_FINISHED', [url]);
                if(crawler.tested.indexOf(url) < 0 ) crawler.tested.push(url)
            });
    },

    /**
     * Check for links in the html of the rendered page so we add them to the que
     * and also map how pages are linked to each other
     *
     * @param {jQuery} html
     * @param {string} url
     */
    fetch_links: function(html, url){
        $.each(html.find('a'), function(){
            var href    = $(this).attr('href'),
                link    = crawler.sanitize(href);

            crawler.que_url( href );

            if(!crawler.linked_from.hasOwnProperty(link)) crawler.linked_from[link] = [url];
            else if( crawler.linked_from[link].indexOf(url) < 0 ) crawler.linked_from[link].push(url);
        });
    },

    /**
     * Run the registered tests
     *
     * @param {string} url
     * @param {jQuery} html
     * @param {Array} headers
     * @param {Array} field_data
     * @param {Array} phrases
     */
    run_tests: function(url, html, headers, field_data, phrases){
        for(var t in this.tests) {
            this.trigger('before'+this.tests[t]['name'], [url, html, headers, field_data, phrases]);
            this.tests[t]['callback'].apply(this.tests[t], [this.tests[t]['cont'], url, html, headers, field_data, phrases]);
            this.trigger('after'+this.tests[t]['name'], [url, html, headers, field_data, phrases]);
        }
    },

    /**
     * Trigger event callback and pass on the data
     *
     * @param {string} event
     * @param {*} data
     */
    trigger: function(event, data){
        if(this.events.hasOwnProperty(event))
            for(var e in this.events[event]) this.events[event][e].apply(this, data);
    },

    /**
     * Register callback on action
     *
     * @param {string} event
     * @param {function} callback
     * @returns {crawler}
     */
    on: function(event, callback){
        if(!this.events.hasOwnProperty(event)) this.events[event] = [];
        this.events[event].push(callback);
    },

    /**
     * Strip out src=<anything> so that we avoid loading the images
     * on the pages
     *
     * @param {string}html
     * @returns {string}
     */
    strip_img_src: function(html){
        return html.replace( /(src).*?=(['|"].*?['|"])/ig, '' );
    },

    /**
     * Return the proxy url to test the passed url
     *
     * @param {$string} url
     * @returns {string}
     */
    get_proxy: function(url){
        return location.protocol + '//' + location.hostname + '/seotest/getPageData?u='+url;
    },

    /**
     * @see crawler_painter.add_row(name, data)
     * @param {string} name
     * @param {Array} data
     */
    add_row: function(name, data){
        crawler_painter.add_row(name, data);
    },

    /**
     * Returns the word count for a given set of sentences or string
     *
     * @param {string|array} data
     * @returns {number}
     */
    get_word_count: function(data){
        if( typeof data === 'string' ) return data.split(' ').length;

        var count = 0;
        for( var d in data ) count += data[d].split(' ').length;
        return count;
    },

    /**
     * Start the crawler
     *
     * @param {object} settings
     * @throws Exception
     */
    init: function(settings){
        this.trigger('BEFORE_INIT', []);

        if(settings.hasOwnProperty('crawl_id')) this.set_crawl_id(settings['crawl_id']);
        if(settings.hasOwnProperty('ignore_paths')) this.set_ignore_paths(settings['ignore_paths']);

        if( !this.crawl_id ) throw "crawl_id must be specified";

        // When a crawl finishes, start a new one if there are any more urls to go through else stop the auto-restart
        this.on('CRAWL_FINISHED', function(){
            if( crawler.que.length > 0 ) crawler.fetch_and_test();
            else window.clearInterval(crawler.interval);
        });

        // Every second try to initialize a new crawl request just in-case something crashes
        this.interval = setInterval(function(){ crawler.fetch_and_test(); }, 1000);

        crawler_painter.init();
        this.trigger('AFTER_INIT', []);
    }
};

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
            toggle_button   = $('<div class="icon toggle right closed"></div>').hide(),
            export_button   = $('<div class="icon export right"></div>').hide(),
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
            crawler.trigger('TOGGLED', [name]);
            var $this   = $(this),
                css     = ($this.hasClass('closed')) ? 'opened' : 'closed';
            $this.parents('.infobox').find('.tableCont').slideToggle();
            $this.removeClass('opened closed');
            $this.addClass(css);
        });

        export_button.click(function(){
            crawler.trigger('BEFORE_EXPORT', [name]);
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
            crawler.trigger('AFTER_EXPORT', [name]);
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
     */
    add_row: function(name, data){
        var cont    = this.get_container_by_name(name),
            table   = cont.find('tbody'),
            row     = $('<tr></tr>').appendTo(table),
            len     = table.find('tr').length;

        for(var d in data) row.append($('<td/>').append(data[d]));

        // Show icons if we have items
        if( len > 0 ){
            cont.find('.icon.export').fadeIn();
            cont.find('.icon.toggle').fadeIn();
        }

        cont.find('.count').html(len);

        // Set the header colour
        if( cont.find('td div.alert-danger').length > 0 ) crawler_painter.set_type(name, 'error');
        else if( cont.find('td div.alert-warning').length > 0 ) crawler_painter.set_type(name, 'warning');
        else if( cont.find('td div.alert-info').length > 0 ) crawler_painter.set_type(name, 'info');
        else if( cont.find('td div.alert-success').length > 0 ) crawler_painter.set_type(name, 'success');
    },

    /**
     * Reset the data inside of the table for the container named {name}
     *
     * @param {string} name
     * @param {string|undefined} type
     */
    reset_table: function(name, type){
        var cont = this.get_container_by_name(name);

        cont.find('tbody tr').remove();
        cont.find('.count').html('');
        cont.find('.icon.export').hide();
        cont.find('.icon.toggle').hide();

        if( type != undefined ) this.set_type(name, type);
    },

    /**
     * Create a status field to be used in the report rows
     *
     * @param string type
     * @param string text
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
        }
        ret.append(text);
        return ret;
    },

    /**
     * Return the container matching the provided name
     *
     * @param {string} name
     * @returns {jQuery}
     */
    get_container_by_name: function(name){
        for(var c in this.containers) if(this.containers[c]['name'] == name) return this.containers[c]['container'];
    },

    /**
     * Set the type of the test so it's colour changes according
     *
     * @param {string} name
     * @param {string} type
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
     * @returns {string}
     */
    create_link: function(url, anchor){
        anchor = (anchor) ? anchor : url;
        return '<a class="btn btn-link" href="'+url+'" target="_blank" rel="nofollow">'
                +'<span class="glyphicon glyphicon-new-window">&nbsp;</span>'+anchor+'</a>';
    },

    /**
     * Initialize the painter
     */
    init:function(){
        for(var c in this.containers) $('#results_container').append(this.containers[c]['container']);
        crawler.on('CRAWL_FINISHED', this.update_header);
    }
};
