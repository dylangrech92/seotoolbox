const crawler_file_tester = {

    robot_rules: [],

    /**
     * Parse the content of the robots file
     *
     * @param {*} result
     * @throws {Exception}
     */
    parse_robots_file: function(result){
        var rules = result.split("\n");
        $('#robots-check').addClass('text-success').append('<span class="glyphicon glyphicon-ok-circle">&nbsp;</span>');

        var agent = '*';
        for(var r in rules){
            if( rules[r].length < 1 || rules[r].toLowerCase().indexOf('sitemap:') >= 0 ){
                continue;
            }else if( rules[r].toLowerCase().indexOf('user-agent:') >= 0 ){
                agent = rules[r].replace(/user-agent:/gi, '').replace(/^\s+|\s+$|\s+(?=\s)/g, '');
            }else if( rules[r].toLowerCase().indexOf('disallow:') >= 0 ){
                var rule =
                    '^'+rules[r]
                    .replace(/disallow:/gi, '') // remove disallow
                    .replace(/^\s+|\s+$|\s+(?=\s)/g, '') // remove white space
                    .replace('?', '\\?') // escape query string start
                    .replace('|', '\\|') // escape pipe
                    .replace('/', '\\/') // escape slashes
                    .replace(/^\^\^/g, '^') // If it already had a caret remove it
                    .replace(/^(\*)/g, '(.*?)'); // Replace star with match anything modifier
                crawler_file_tester.robot_rules.push({ 'rule': rule, 'agent': agent, 'original': rules[r] });
            }else{
                console.log(rules[r]);
                throw "Found a rule which we don't understand. Report it to the developer";
            }
        }
    },

    /**
     * Check all tested url and see if they are blocked by any rule in the robots file
     *
     * @returns {undefined}
     */
    test_blocked_pages: function(){
        for(var t in crawler.tested){
            var url = crawler.tested[t];

            if( crawler.linked_from.hasOwnProperty(url) ) {
                for (var r in this.robot_rules) {
                    var regex = new RegExp(this.robot_rules[r]['rule'], 'g');
                    if (regex.test('/' + url)) {
                        var link    = crawler.painter.create_link(url, url),
                            status  = crawler.painter.create_status('error', 'Page has links and is blocked in robots'),
                            agent   = ( this.robot_rules[r]['agent'] == '*' ) ? 'ALL BOTS' : this.robot_rules[r]['agent'];
                        crawler.painter.add_row(
                            'blocked_pages',
                            [link, crawler.linked_from[url].join(', '), agent, this.robot_rules[r]['original'], status]);
                    }
                }
            }
        }

        return undefined;
    },

    /**
     * Parse the content of the sitemap file
     *
     * @returns undefined
     */
    parse_sitemap_file: function(result){
        crawler.sitemap = [];
        var ruleset = $($(result).filter('urlset')[0]);
        $.each(ruleset.children(), function() {
            crawler.sitemap.push( crawler.sanitize($(this).find('loc')[0].innerHTML) );
        });

        $('#sitemap-check').addClass('text-success').append('<span class="glyphicon glyphicon-ok-circle">&nbsp;</span>');

        return undefined;
    },

    /**
     * Test the urls in the sitemap
     *
     * @returns {undefined}
     */
    test_sitemap: function(){
        var sitemap = crawler.sitemap;

        for(var u in sitemap){
            var link = crawler.painter.create_link(sitemap[u], sitemap[u]);

            if( crawler.failed.indexOf(sitemap[u]) >= 0 ) {
                var status = crawler.painter.create_status('error', 'Page found in sitemap but is broken');
                crawler.painter.add_row('sitemap', [link, status]);
                continue;
            }

            if( crawler.tested.indexOf(sitemap[u]) < 0 ){
                var status = crawler.painter.create_status('warning', 'Page found in sitemap but not found by crawler');
                crawler.painter.add_row('sitemap', [link, status]);
                continue;
            }

            if( !crawler.linked_from.hasOwnProperty(sitemap[u]) ){
                var status = crawler.painter.create_status('info', 'Page found in sitemap but has no links on the site');
                crawler.painter.add_row('sitemap', [link, status]);
            }
        }

        return undefined;
    },

    /**
     * Setup an ajax call to fetch url
     *
     * @param {string} url
     * @param {function} callback
     * @param {function} failed_callback
     *
     * @returns {undefined}
     */
    get_file_contents: function(url, callback, failed_callback){
        var t = $.ajax({
            'url': crawler.get_proxy('/seotest/getPage?u='+url+'&agent='+crawler.agent)
        }).done(callback).fail(failed_callback);
        return undefined;
    }
};

// Register the tests
crawler.event_handler.on('BEFORE_INIT', function(){
    crawler.regiser_test('blocked_pages', 'BLOCKED PAGES', ['URL', 'Linked From', 'Blocked For', 'Blocked By', 'Status'], false);
    crawler.painter.set_type('blocked_pages', 'default');
    crawler.regiser_test('sitemap', 'SITEMAP', ['URL', 'Status'], false);
    crawler.painter.set_type('sitemap', 'default');
});

// Start up the file testers
crawler.event_handler.on('AFTER_INIT', function(){
    crawler_file_tester.get_file_contents(
        crawler.robots_url,
        crawler_file_tester.parse_robots_file,
        function(){ $('#robots-check').addClass('text-danger').append('<span class="glyphicon glyphicon-remove-circle">&nbsp;</span>'); }
    );
    crawler_file_tester.get_file_contents(
        crawler.sitemap_url,
        crawler_file_tester.parse_sitemap_file,
        function(){ $('#sitemap-check').addClass('text-danger').append('<span class="glyphicon glyphicon-remove-circle">&nbsp;</span>'); }
    );
});

// Test for blocked pages the the crawler finishes
crawler.event_handler.on('ALL_CRAWLS_FINISHED', function(){
    crawler_file_tester.test_blocked_pages();
    crawler_file_tester.test_sitemap();
});

