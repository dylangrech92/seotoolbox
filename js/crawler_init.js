(function($){
    $.ajax({
        url	        : '/seotest/urlsAndSettings',
        dataType    : 'json',
        success     : function( result ){
            if( !result ) throw "Error loading initial urls and settings";

            $('#init-form').fadeIn();
            $('#init-crawler-btn').click(function(){
                crawler.useragent = $('#user-agent').val();

                // Register the default tests
                for( var i in default_tests ){
                    var test = default_tests[i];
                    crawler.regiser_test(test.name, test.title, test.headers, test.callback);
                    crawler_painer.set_type(test.name, test.type);
                }

                // Que initial urls
                for( var i in result['urls'] ) crawler.que_url(result['urls'][i]);

                crawler.init(result['settings']);

                $('#init-popup').hide();
                $('#results_container').fadeIn();
            });
        }
    });
}(jQuery))
