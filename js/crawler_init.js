(function($){
    $.ajax({
        url	        : '/seotest/urlsAndSettings',
        dataType    : 'json',
        success     : function( result ){
            if( !result ) throw "Error loading initial urls and settings";

            $('#init-form').fadeIn();
            $('#init-crawler-btn').click(function(){
                crawler.robots_url  = $('#robots-url').val();
                crawler.sitemap_url = $('#sitemap-url').val();
                crawler.useragent   = $('#user-agent').val();

                // Que initial urls
                for( var j in result['urls'] ) crawler.que_url(result['urls'][j]);

                crawler.init(result['settings']);

                $('#init-popup').hide();
                $('#results_container').fadeIn();
                $('.legend-btn').fadeIn();

                $('.legend-btn, #legend').click(function(){
                    $('#legend-btn').toggle();
                    $('#legend').toggle();
                })
            });
        }
    });
}(jQuery));
