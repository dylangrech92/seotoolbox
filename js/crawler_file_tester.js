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
        crawler_painter.add_row('robots_page',[ status, result.replace(/(?:\r\n|\r|\n)/g, '<br />') ]);

        var agent = '*';
        for(var r in rules){
            if( rules[r].length < 1 || rules[r].toLowerCase().indexOf('sitemap:') >= 0 ){
                continue;
            }else if( rules[r].toLowerCase().indexOf('user-agent:') >= 0 ){
                agent = rules[r].replace(/user-agent:/gi, '');
            }else if( rules[r].toLowerCase().indexOf('disallow:') >= 0 ){
                var rule = rules[r].replace(/disallow:/gi, '');
                crawler_file_tester.robot_rules.push({ 'rule': rule, 'agent': agent });
            }else{
                console.log(rules[r]);
                throw "Found a rule which we don't understand. Report it to the developer";
            }
        }

        console.log(crawler_file_tester.robot_rules);
    },

    get_file_contents: function(url, type, callback, failed_callback){
        $.ajax({ 'url' : url, 'dataType' : type }).done(callback).fail(failed_callback);
    },

    init: function(){
        // Robots
        crawler.regiser_test('robots_page', 'ROBOTS PAGE', ['Status', 'Content'], false);
        crawler.regiser_test('blocked_pages', 'BLOCKED PAGES', ['URL'], this.test_blocked_pages);
        crawler_file_tester.get_file_contents(
            crawler.robots_url,
            'text',
            crawler_file_tester.parse_robots_file,
            function(){
                var status = crawler_painter.create_status('error', 'Failed to load robots file');
                crawler_painter.add_row('robots_page', [ status ]);
            }
        );

        // Sitemap
    }
};

/**
 * Start up the file tester
 */
(function($){
    crawler.on('BEFORE_INIT', crawler_file_tester.init);
}(jQuery));
