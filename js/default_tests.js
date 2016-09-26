const default_tests = [
    {
        name: 'error_pages',
        title: 'ERROR PAGES',
        headers: ['URL'],
        type: 'success'
    },

    {
        name : 'h1_info',
        title: 'H1 INFO',
        headers: ['URL', 'Count', 'Text', 'Status'],
        callback: function(cont, url, html){
            var h1      = html.find( 'h1' ),
                link    = crawler_painter.create_link(url, url),
                joined  = [],
                status;

            h1.each(function(){ joined.push(this.innerHTML); });

            if(h1.length != 1)
                status = crawler_painter.create_status('error', (h1.length < 1) ? 'Missing H1' : 'Multiple H1 tags');
            else status = crawler_painter.create_status('success', 'OK!');

            crawler_painter.add_row(this.name, [link, h1.length, joined.join(', '), status]);

            return true;
        }
    },

    {
        name : 'h2_info',
        title: 'H2 INFO',
        headers: ['URL', 'Count', 'Text', 'Status'],
        callback: function(cont, url, html){
            var h2      = html.find( 'h2' ),
                link    = crawler_painter.create_link(url, url),
                joined  = [], status;

            h2.each(function(){ joined.push(this.innerHTML); });

            if(h2.length < 1) status = crawler_painter.create_status('warning', 'Missing H2');
            else status = crawler_painter.create_status('success', 'OK!');

            crawler_painter.add_row(this.name, [link, h2.length, joined.join(', '), status]);

            return true;
        }
    },

    {
        name : 'word_count',
        title: 'WORD COUNT',
        headers: ['URL', 'Word Count', 'Article Word Count'],
        callback: function(cont, url, html, headers, field_data, phrases){
            var link        = crawler_painter.create_link(url, url),
                word_count  = crawler.get_word_count(phrases),
                art_count   = crawler.get_word_count(field_data[3]);

            crawler_painter.add_row(this.name, [link, word_count, art_count]);

            return true;
        }
    },

    {
        name : 'int_link_info',
        title: 'INTERNAL LINK INFO',
        headers: ['URL', 'Article Links', 'Article Link Count', 'Article Density',
                    'Total Link Count', 'Total Density', 'Status'],
        type: 'info',
        callback: function(cont, url, html, headers, field_data, phrases){
            var link = crawler_painter.create_link(url, url),
                art_links = [], links = [];

            // Article links
            for( var field in field_data[2] ) {
                $.each($(field_data[2][field]).find('a'), function () {
                    var href = $(this).attr('href');
                    if(href && !crawler.is_external(href) && !crawler.is_anchor(href, url)) art_links.push(href);
                });
            }

            // Full page links
            $.each(html.find('a'), function () {
                var href = $(this).attr('href');
                if(href && !crawler.is_external(href) && !crawler.is_anchor(href, url)) links.push(href);
            });

            var art_word_count  = crawler.get_word_count(field_data[3]),
                art_density     = (art_links.length > 0) ? art_word_count / art_links.length : false,
                art_dens_text   = (art_density != false) ? art_density.toFixed(2) +' words/link' : 'No internal links',
                word_count      = crawler.get_word_count(phrases),
                density         = (links.length > 0) ? word_count / links.length : false,
                dens_text       = (density != false) ? density.toFixed(2) +' words/link' : 'No internal links',
                status          = crawler_painter.create_status('success', 'OK!');

            if( ( art_density !== false && art_density < 100 ) )
                status = crawler_painter.create_status('warning', 'This page might be considered spammy');

            if(links.length > 0)
                crawler_painter.add_row( this.name, [
                    link, art_links.join('<br />'), art_links.length, art_dens_text, links.length, dens_text, status
                ]);

            return true;
        }
    },

    {
        name : 'ext_link_info',
        title: 'EXTERNAL LINK INFO',
        headers: ['URL', 'External Link Count', 'External Links'],
        type: 'success',
        callback: function(cont, url, html, headers, field_data){
            var link = crawler_painter.create_link(url, url),
                links = [];

            for( var field in field_data[2] ) {
                $.each($(field_data[2][field]).find('a'), function () {
                    var $this = $(this),
                        href = $this.attr('href');
                    if(href && crawler.is_external(href)){
                        var type = ( !$this.attr('rel') || $this.attr('rel').toLowerCase().indexOf('nofollow') < 0 )
                            ? 'warning' : 'info';
                        links.push(
                            $('<div class="clearfix"></div>').append([
                                crawler_painter.create_status(type, href),
                                '<p>&nbsp;</p>'
                            ])
                        );
                    }
                });
            }

            if(links.length > 0) crawler_painter.add_row(this.name, [link, links.length, links]);

            return true;
        }
    },

    {
        name : 'img_info',
        title: 'IMAGE INFO',
        headers: ['URL', 'Count', 'Missing Alt Tag', 'Missing Title Tag', 'Fields Missing Images', 'Status'],
        type: 'success',
        callback: function(cont, url, html, headers, field_data) {
            var link = crawler_painter.create_link(url, url),
                imgs = html.find('img'),
                alt = 0, title = 0, fields = [], status = '';

            // Check alt and title tags
            $.each(imgs, function () {
                var $this = $(this);
                if (!$this.attr('alt') || $this.attr('alt').length < 1) alt += 1;
                if (!$this.attr('title') || $this.attr('title').length < 1) title += 1;
            });

            // Check the fields
            for (var f in field_data[2]) if ($(field_data[2][f]).find('img').length < 1) fields.push(field_data[1][f]);

            // Construct Result
            if (alt > 0)
                status = crawler_painter.create_status('error',
                    (alt > 1) ? alt + ' images missing alt tag' : '1 image missing alt tag');
            else if(fields.length > 0)
                status = crawler_painter.create_status('warning',
                    (fields.length > 1) ? fields.join(' and ') + ' are missing images' : fields[0] + ' is missing images');
            else if(title > 0)
                status = crawler_painter.create_status('info',
                    (title > 1) ? title + ' images missing title tag' : '1 image is missing title tag');
            else
                status = crawler_painter.create_status('success', 'OK!');

            crawler_painter.add_row(this.name, [link, imgs.length, alt, title, fields.join(', '), status]);

            return true;
        }
    },

    {
        name: 'title_info',
        title: 'META TITLE',
        headers: ['URL', 'Meta Title', 'Length', 'Status'],
        callback: function(cont, url, html){
            var title   = html.filter( 'title' ),
                link    = crawler_painter.create_link(url, url),
                text    = (title.length == 1) ? title.html() : '',
                status  = crawler_painter.get_meta_tags_status(title, 'meta title', text, 40, 56);

            if(title.length == 1){
                crawler.set_property('meta_titles', text, url);
            }

            crawler_painter.add_row(this.name, [link, text, text.length, status]);

            return true;
        }
    },

    {
        name: 'description_info',
        title: 'META DESCRIPTION',
        headers: ['URL', 'Meta Description', 'Length', 'Status'],
        callback: function(cont, url, html){
            var desc    = html.filter( 'meta[name=description]' ),
                link    = crawler_painter.create_link(url, url),
                text    = (desc.length == 1) ? desc.attr('content') : '',
                status  = crawler_painter.get_meta_tags_status(desc, 'meta description', text, 70, 156);

            if( desc.length == 1 ){
                crawler.set_property('descriptions', text, url);
            }

            crawler_painter.add_row(this.name, [link, text, text.length, status]);

            return true;
        }
    },

    {
        name: 'canonical_info',
        title: 'CANONICAL INFO',
        headers: ['URL', 'Status'],
        type: 'success',
        callback: function(cont, url, html){
            var tags = html.filter( 'link' ), canonical;

            for( var i = 0; i < tags.length; i++ ) {
                var rel = $(tags[i]).attr('rel');
                if( rel && rel.toLowerCase() === 'canonical' ) {
                    canonical = $(tags[i]).attr('rel');
                    break;
                }
            }

            if(canonical === undefined || canonical.length != 1) {
                var status = crawler_painter.create_status('error', 'Missing / Multiple canonicals found');
                crawler_painter.add_row(this.name, [crawler_painter.create_link(url, url), status]);
            }else{
                crawler.set_property('canonicals', canonical, url);
            }

            return true;
        }
    },

    {
        name: 'no-index_pages',
        title: 'NO-INDEX PAGES',
        headers: ['URL'],
        type: 'success',
        callback: function(cont, url, html){
            var tags = html.filter( 'meta' );
            for( var i = 0; i < tags.length; i++ )
                if( $(tags[i]).attr( 'name' ) && $(tags[i]).attr( 'name' ).toLowerCase() === 'robots' &&
                        $(tags[i]).attr('content').toLowerCase().indexOf( 'noindex' ) > -1 ) {
                    crawler_painter.add_row(this.name, [crawler_painter.create_link(url, url)]);
                    crawler_painter.set_type(this.name, 'warning');
                    return;
                }

            return true;
        }
    },

    {
        name: 'urls_test',
        title: 'URL STRUCTURE',
        headers: ['URL', 'Status'],
        type: 'success',
        callback: function(cont, url){
            var link = crawler_painter.create_link(url, url),
                msg;

            if( url.length > 115 )                  msg = 'URL is too long';
            else if( url.toLowerCase() != url )     msg = 'URL is not in lower case';
            else if( url.replace('_','') !== url )  msg = 'URL contains under scores';
            else return true;

            crawler_painter.add_row(this.name, [link, crawler_painter.create_status('warning', msg)]);

            return true;
        }
    },

    {
        name: 'duplicate_meta_tags',
        title: 'DUPLICATE META TAGS',
        headers: ['URL', 'Status'],
        type: 'success',
        callback: function(){
            var canonicals = crawler.canonicals,
                tests      = {
                    'meta_titles'   : 'Urls have same meta title but different canonicals',
                    'descriptions'  : 'Urls have same meta description but different canonicals'
                };

            // Reset table
            crawler_painter.reset_table(this.name, 'success');

            for(var test in tests){
                for(var x in crawler[test]){
                    var urls = crawler[test][x];
                    if( urls < 2 ) continue;
                    var canonical = getKeyFromObject(canonicals, urls[0]);
                    for( var i in urls )
                        if( canonical != getKeyFromObject(canonicals, urls[i]) ) {
                            crawler_painter.add_row(
                                this.name,
                                [urls.join(', '), crawler_painter.create_status('error', tests[test])]
                            );
                            break;
                        }
                }
            }

            function getKeyFromObject(object, search){
                for( var key in object ) if( object[key].indexOf(search) >= 0 ) return key;
                return undefined;
            }

            return true;
        }
    },

    {
        name: 'href_langs',
        title: 'LANG TAGS',
        headers: ['URL', 'Tags'],
        type: 'info',
        callback: function(cont, url, html){
            var link    = crawler_painter.create_link(url, url),
                tags    = [];

            $.each( html.filter( 'link' ), function(){
                if( $(this).attr( 'hreflang' ) )
                    tags.push( $('<p>').text( $(this).clone().wrap('<p>').parent().html() ).html() );
            });

            if( tags.length > 0 ) crawler_painter.add_row(this.name, [link, tags.join('<br />')] );

            return true;
        }
    },

    {
        name: 'orphan_pages',
        title: 'ORPHAN PAGES',
        headers: ['URL']
    }
];

crawler.on('CRAWL_LOAD_FAILED', function(url){
    crawler_painter.add_row('error_pages', [url]);
    crawler_painter.set_type('error_pages', 'error');
});

crawler.on('CRAWL_FINISHED', function(){
    if(crawler.que.length > 0) return true;
    crawler_painter.reset_table('orphan_pages', 'success');

    pages_loop:
        for( var i in crawler.tested ){
            var url = crawler.tested[i];

            if( crawler.failed.indexOf(url) >= 0 ){
                continue;
            }

            if( crawler.linked_from.hasOwnProperty(url) ) {
                for (var x in crawler.linked_from[url])
                    if (crawler.linked_from[url][x] != url) continue pages_loop;
            }

            crawler.add_row('orphan_pages', [crawler_painter.create_link(crawler.tested[i], crawler.tested[i])]);
            crawler_painter.set_type('orphan_pages', 'error');
        }

    return true;
});

/**
 * Gets the status box for the meta tag being tested
 * Append to the crawler_painter
 *
 * @param {Array} tags
 * @param {string} tag_name
 * @param {string} text
 * @param {int} min_char
 * @param {int} max_char
 * @returns {jQuery}
 */
crawler_painter.get_meta_tags_status = function(tags, tag_name, text, min_char, max_char){
    if( tags.length > 1 ){
        return this.create_status('error', 'Multiple '+tag_name+' tags');
    }else if( tags.length < 1 ){
        return this.create_status('error', 'Missing '+tag_name+' tag');
    }else{
        var len = text.length;
        if(len < min_char){
            return this.create_status('warning', tag_name+' is too short');
        }else if(len > max_char){
            return this.create_status('warning', tag_name+' is too long');
        }else{
            return this.create_status('success', 'OK!');
        }
    }
};
