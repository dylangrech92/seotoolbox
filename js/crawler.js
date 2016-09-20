const crawler = {

    que             : [],
    tested          : [],
    tests           : [],
    ignore_paths    : [],
    crawl_id        : undefined,
    events          : {},
    useragent       : 'desktop',

    /**
     * Register a test to run.
     *
     * @param {string} name
     * @param {string} title
     * @param {array} headers
     * @param {string} callable
     * @returns {boolean}
     * @throws Exception
     */
    regiser_test: function(name, title, headers, callable){
        if(name == undefined || this.get_test_by_name(name)) throw 'Invalid name specified for your test';
        if(title == undefined) throw 'Title not specified';
        if(!(headers instanceof Array) || headers.length < 1) throw 'Headers array is invalid';
        if(typeof callable != 'function') throw 'Invalid callback';
        this.tests.push({name: name, title: title, callback: callable, cont:crawler_painer.create(name, title, headers)});
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
        return !(this.tested.indexOf(url) >= 0 || this.is_file(url) || this.ignore_url(url) || this.is_external(url));
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
        if( url[0] == '/' || url[0] == '#' || url.indexOf('://') < 0 ) return false;

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
        this.tested.push(url);

        $.ajax({
            url: this.get_proxy( url ), data: { agent: this.useragent }, accepts: 'json', dataType: 'json'
        })
            .done(function( result ) {
                if(result['headers'] && result['body'] && result['body'].toLowerCase().indexOf('<head') >= 0) {
                    var html = $(crawler.strip_img_src(result['body']));
                    crawler.trigger('CRAWL_BEFORE_TESTS', [url]);
                    crawler.fetch_links(html);
                    crawler.run_tests(url, html, result['headers'], result['field_data'], result['phrases']);
                    crawler.trigger('CRAWL_AFTER_TESTS', [url]);
                }else{
                    crawler.trigger('CRAWL_LOAD_FAILED', [url]);
                }
            })
            .fail( function(){ crawler.trigger('CRAWL_LOAD_FAILED', [url]) })
            .always( function(){ crawler.trigger('CRAWL_FINISHED', [url]) });
    },

    /**
     * Check for links in the html of the rendered page so we add them to the que
     *
     * @param {jQuery} html
     */
    fetch_links: function(html){
        $.each(html.find('a'), function(){ crawler.que_url( $(this).attr('href') ); });
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
        crawler_painer.add_row(name, data);
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

        crawler_painer.init();
        this.trigger('AFTER_INIT', []);
    }
};

const crawler_painer = {

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

        // #TODO: Export Button
        export_button.click(function(){
            crawler.trigger('BEFORE_EXPORT', [name]);
            // Export
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
        if( len > 1 ){
            cont.find('.icon.export').fadeIn();
            cont.find('.icon.toggle').fadeIn();
        }

        cont.find('.count').html(len);
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
        switch(type){
            case 'info': return this.get_container_by_name(name).addClass('blue');
            case 'error': return this.get_container_by_name(name).addClass('red');
            case 'success': return this.get_container_by_name(name).addClass('green');
            default: return this.get_container_by_name(name).addClass('purple');
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
        return '<a href="'+url+'" target="_blank" rel="nofollo">'+anchor+'</a>';
    },

    /**
     * Initialize the painter
     */
    init:function(){
        for(var c in this.containers) $('#results_container').append(this.containers[c]['container']);
        crawler.on('CRAWL_FINISHED', this.update_header);
    }
};
