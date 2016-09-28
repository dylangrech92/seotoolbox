const crawler_file_tester = {

    robot_rules: [],

    /**
     * Parse the content of the robots file
     *
     * @param {*} result
     * @throws {Exception}
     */
    parse_robots_file: function(result){
        var rules   = result.split("\n"),
            status  = crawler_painter.create_status('success', 'Robots file loaded');
        crawler_painter.add_row('file_tests', [ status, result.replace(/(?:\r\n|\r|\n)/g, '<br />') ]);

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
     * Check if the given url is blocked by the robot rules we have
     *
     * @param {string} url
     * @returns {boolean|string}
     */
    is_blocked_in: function(url){

        return false;
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
                        var link    = crawler_painter.create_link(url, url),
                            status  = crawler_painter.create_status('error', 'Page has links and is blocked in robots'),
                            agent   = ( this.robot_rules[r]['agent'] == '*' ) ? 'ALL BOTS' : this.robot_rules[r]['agent'];
                        crawler_painter.add_row(
                            'blocked_pages',
                            [link, crawler.linked_from[url].join(', '), agent, this.robot_rules[r]['original'], status]);
                    }
                }
            }
        }

        return undefined;
    },

    get_file_contents: function(url, type, callback, failed_callback){
        $.ajax({ 'url' : url, 'dataType' : type }).done(callback).fail(failed_callback);
    },

    /**
     * Start testing the robots page
     */
    init_robots_tester: function(){
        crawler.regiser_test('blocked_pages', 'BLOCKED PAGES', ['URL', 'Linked From', 'Blocked For', 'Blocked By', 'Status'], false);
        crawler_painter.set_type('blocked_pages', 'success');

        this.get_file_contents( crawler.robots_url, 'text', this.parse_robots_file, function(){
            crawler_painter.add_status_row('file_tests', 'error', 'Failed to load robots file');
        });

        crawler.on('CRAWL_FINISHED', function(){
           if( crawler.que.length < 1 ){
               crawler_file_tester.test_blocked_pages();
           }
        });
    },


};

// Start up the file tester
crawler.on('BEFORE_INIT', function(){
    crawler.regiser_test('file_tests', 'FILE TESTS', ['Status', 'Content'], false);
    crawler_file_tester.init_robots_tester();
    //crawler_file_tester.init_sitemap_tester();
});

