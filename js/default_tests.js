const default_tests = {

    // [name, title, headers, type]
    tests: [
        ['bad_links', 'BAD LINKS', ['URL', 'Linked From'], ''],
        ['h1_info', 'H1 INFO', ['URL', 'Count', 'Text', 'Status']],
        ['h2_info', 'H2 INFO', ['URL', 'Count', 'Text', 'Status']],
        ['word_count', 'WORD COUNT', ['URL', 'Word Count', 'Article Word Count'], 'info'],
        ['int_link_info', 'INTERNAL LINKS',
            ['URL', 'Article Links', 'Article Link Count', 'Article Density', 'Total Link Count', 'Total Density', 'Status'],
            'info'],
        ['ext_link_info', 'EXTERNAL LINKS', ['URL', 'External Link Count', 'External Links'], 'success'],
        ['img_info', 'IMAGES', ['URL', 'Count', 'Missing Alt Tag', 'Missing Title Tag', 'Fields Missing Images', 'Status'], 'success'],
        ['title_info', 'META TITLE', ['URL', 'Meta Title', 'Length', 'Status']],
        ['description_info', 'META DESCRIPTION', ['URL', 'Meta Description', 'Length', 'Status']],
        ['canonical_info', 'CANONICAL', ['URL', 'Status'], 'success'],
        ['noindex_pages', 'NO-INDEX PAGES', ['URL'], 'success'],
        ['urls_test', 'URL STRUCTURE', ['URL', 'Status'], 'success'],
        ['duplicate_meta_tags', 'DUPLICATE META TAGS', ['URL', 'Status']],
        ['href_langs', 'LANG TAGS', ['URL', 'Tags'], 'info'],
        ['orphan_pages', 'ORPHAN PAGES', ['URL']],
        ['redirect_links', 'REDIRECT LINKS', ['Link', 'In', 'Redirects To']],
    ],

    /**
     * Test the h1s on the page provided
     *
     * @param {string} url
     * @param {jQuery} html
     * @returns {undefined}
     */
    h1_info: function(url, html){
        var h1      = html.find( 'h1' ),
            link    = crawler.painter.create_link(url, url),
            joined  = [],
            status;

        h1.each(function(){ joined.push(this.innerHTML); });

        if(h1.length != 1)
            status = crawler.painter.create_status('error', (h1.length < 1) ? 'Missing H1' : 'Multiple H1 tags');
        else status = crawler.painter.create_status('success', 'OK!');

        return crawler.painter.add_row(this.name, [link, h1.length, joined.join(', '), status]);
    },

    /**
     * Test the h2s on the page provided
     *
     * @param {string} url
     * @param {jQuery} html
     * @returns {undefined}
     */
    h2_info: function(url, html){
        var h2      = html.find( 'h2' ),
            link    = crawler.painter.create_link(url, url),
            joined  = [], status;

        h2.each(function(){ joined.push(this.innerHTML); });

        if(h2.length < 1) status = crawler.painter.create_status('warning', 'Missing H2');
        else status = crawler.painter.create_status('success', 'OK!');

        return crawler.painter.add_row(this.name, [link, h2.length, joined.join(', '), status]);
    },

    /**
     * Check the word count for the passed page
     *
     * @param {string} url
     * @param {jQuery} html
     * @param {string} headers
     * @param {Array} field_data
     * @param {Array} phrases
     * @returns {undefined}
     */
    word_count: function(url, html, headers, field_data, phrases){
        var link        = crawler.painter.create_link(url, url),
            word_count  = crawler.get_word_count(phrases),
            art_count   = crawler.get_word_count(field_data[3]);

        return crawler.painter.add_row(this.name, [link, word_count, art_count]);
    },

    /**
     * Test the internal links found on the page provided
     *
     * @param {string} url
     * @param {jQuery} html
     * @param {string} headers
     * @param {Array} field_data
     * @param {Array} phrases
     * @returns {undefined}
     */
    int_link_info: function(url, html, headers, field_data, phrases){
        var link = crawler.painter.create_link(url, url),
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
            status          = crawler.painter.create_status('success', 'OK!');

        if( ( art_density !== false && art_density < 100 ) )
            status = crawler.painter.create_status('warning', 'This page might be considered spammy');

        if(links.length > 0)
            crawler.painter.add_row( this.name, [
                link, art_links.join('<br />'), art_links.length, art_dens_text, links.length, dens_text, status
            ]);

        return undefined;
    },

    /**
     * Test the external links on the page provided
     *
     * @param {string} url
     * @param {jQuery} html
     * @param {string} headers
     * @param {Array} field_data
     * @returns {undefined}
     */
    ext_link_info: function(url, html, headers, field_data){
        var link = crawler.painter.create_link(url, url),
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
                            crawler.painter.create_status(type, href),
                            '<p>&nbsp;</p>'
                        ])
                    );
                }
            });
        }

        if(links.length > 0){
            crawler.painter.add_row(this.name, [link, links.length, links]);
        }

        return undefined;
    },

    /**
     * Test the images on the page provided
     *
     * @param {string} url
     * @param {jQuery} html
     * @param {string} headers
     * @param {Array} field_data
     * @returns {undefined}
     */
    img_info: function(url, html, headers, field_data) {
        var link = crawler.painter.create_link(url, url),
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
            status = crawler.painter.create_status('error',
                (alt > 1) ? alt + ' images missing alt tag' : '1 image missing alt tag');
        else if(fields.length > 0)
            status = crawler.painter.create_status('warning',
                (fields.length > 1) ? fields.join(' and ') + ' are missing images' : fields[0] + ' is missing images');
        else if(title > 0)
            status = crawler.painter.create_status('info',
                (title > 1) ? title + ' images missing title tag' : '1 image is missing title tag');
        else
            status = crawler.painter.create_status('success', 'OK!');

        return crawler.painter.add_row(this.name, [link, imgs.length, alt, title, fields.join(', '), status]);
    },

    /**
     * Test the meta title of the page provided
     *
     * @param {string} url
     * @param {jQuery} html
     * @returns {undefined}
     */
    title_info: function(url, html){
        var title   = html.filter( 'title' ),
            link    = crawler.painter.create_link(url, url),
            text    = (title.length == 1) ? title.html() : '',
            status  = default_tests.get_meta_tags_status(title, 'meta title', text, 40, 56);

        if(title.length == 1){
            crawler.set_property('meta_titles', text, url);
        }

        return crawler.painter.add_row(this.name, [link, text, text.length, status]);
    },

    /**
     * Test the meta description for the page provided
     *
     * @param {string} url
     * @param {jQuery} html
     * @returns {undefined}
     */
    description_info: function(url, html){
        var desc    = html.filter( 'meta[name=description]' ),
            link    = crawler.painter.create_link(url, url),
            text    = (desc.length == 1) ? desc.attr('content') : '',
            status  = default_tests.get_meta_tags_status(desc, 'meta description', text, 70, 156);

        if( desc.length == 1 ){
            crawler.set_property('descriptions', text, url);
        }

        return crawler.painter.add_row(this.name, [link, text, text.length, status]);
    },

    /**
     * Test the canonical rules for the page provided
     *
     * @param {string} url
     * @param {jQuery} html
     * @returns {undefined}
     */
    canonical_info: function(url, html){
        var tags = default_tests.get_tags(html, 'link', 'rel', 'canonical');

        if(tags.length != 1) {
            var status = crawler.painter.create_status('error', 'Missing / Multiple canonicals found');
            crawler.painter.add_row(this.name, [crawler.painter.create_link(url, url), status]);
        }else{
            crawler.set_property('canonicals', tags[0].attr('href'), url);
        }

        return undefined;
    },

    /**
     * Check if the page provided has a no-index header
     *
     * @param {string} url
     * @param {jQuery} html
     * @returns {undefined}
     */
    noindex_pages: function(url, html) {
        if(default_tests.get_tags(html, 'meta', 'content', 'noindex').length > 0){
            crawler.painter.add_row(this.name, [crawler.painter.create_link(url, url)]);
            crawler.painter.set_type(this.name, 'error');
        }

        return undefined;
    },

    /**
     * Test the url passed for it's structure
     *
     * @param url
     * @returns {undefined}
     */
    urls_test: function(url){
        var link = crawler.painter.create_link(url, url),
            msg;

        if( url.length > 115 )                  msg = 'URL is too long';
        else if( url.toLowerCase() != url )     msg = 'URL is not in lower case';
        else if( url.replace('_','') !== url )  msg = 'URL contains under scores';
        else return undefined;

        return crawler.painter.add_row(this.name, [link, crawler.painter.create_status('warning', msg)]);
    },

    /**
     * Check for href lang tags in the page provided
     *
     * @param {string} url
     * @param {jQuery} html
     * @returns {undefined}
     */
    href_langs: function(url, html){
        var link    = crawler.painter.create_link(url, url),
            tags    = [];

        $.each( html.filter( 'link' ), function(){
            if( $(this).attr( 'hreflang' ) )
                tags.push( $('<p>').text( $(this).clone().wrap('<p>').parent().html() ).html() );
        });

        if( tags.length > 0 ) crawler.painter.add_row(this.name, [link, tags.join('<br />')] );

        return undefined;
    },

    /**
     * Returns a list of jQuery Objects that are of type {tag},
     * have an attribute {key} an it's value is {value}
     *
     * @param {jQuery} html
     * @param {string} tag
     * @param {string} key
     * @param {string} value
     * @returns {Array}
     */
    get_tags: function(html, tag, key, value){
        var returns = [];

        $.each(html.filter(tag), function(){
            var $this = $(this);
            if( $this.attr(key) && $this.attr(key) == value ){
                returns.push($this);
            }
        });

        return returns;
    },

    /**
     * Goes through an object and tries to find a key that has a value matching the value passed
     *
     * @param {*} object
     * @param {*} search
     * @returns {*}
     */
    get_key_from_object: function(object, search){
        for( var key in object ) if( object[key].indexOf(search) >= 0 ) return key;
        return undefined;
    },

    /**
     * Gets the status box for the meta tag being tested
     * Append to the crawler.painter
     *
     * @param {Array} tags
     * @param {string} tag_name
     * @param {string} text
     * @param {int} min_char
     * @param {int} max_char
     * @returns {jQuery}
     */
    get_meta_tags_status: function(tags, tag_name, text, min_char, max_char){
        if( tags.length > 1 ){
            return crawler.painter.create_status('error', 'Multiple '+tag_name+' tags');
        }else if( tags.length < 1 ){
            return crawler.painter.create_status('error', 'Missing '+tag_name+' tag');
        }else{
            var len = text.length;
            if(len < min_char){
                return crawler.painter.create_status('warning', tag_name+' is too short');
            }else if(len > max_char){
                return crawler.painter.create_status('warning', tag_name+' is too long');
            }else{
                return crawler.painter.create_status('success', 'OK!');
            }
        }
    },

    /**
     * Return a string of links if there is a list of linked_from for the given url
     * else return false
     *
     * @param {string} url
     * @returns {string|boolean}
     */
    get_linked_from_links: function(url){
        if( crawler.linked_from.hasOwnProperty( url ) ) {
            var linked_from = [];
            for (var lf in crawler.linked_from[url]) {
                var link = crawler.painter.create_link(crawler.linked_from[url][lf], crawler.linked_from[url][lf]);
                linked_from.push(link);
            }
            return linked_from.join('<br />');
        }else{
            return false;
        }
    }
}

// Register the tests
crawler.event_handler.on('BEFORE_INIT', function(){
    for( var t in default_tests.tests ){
        var test = default_tests.tests[t],
            func = default_tests.hasOwnProperty( test[0] ) ? default_tests[test[0]] : false;

        crawler.regiser_test(test[0], test[1], test[2], func);
        crawler.painter.set_type(test[0], test[3] || 'default');
    }
});

// When crawler is done check for orphan pages
crawler.event_handler.on('ALL_CRAWLS_FINISHED', function(){
    crawler.painter.set_type('orphan_pages', 'success');
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

            crawler.painter.add_row('orphan_pages', [crawler.painter.create_link(crawler.tested[i], crawler.tested[i])]);
            crawler.painter.set_type('orphan_pages', 'error');
        }

    return true;
});

// When crawler is done check for duplicate meta tags
crawler.event_handler.on('ALL_CRAWLS_FINISHED', function(){
    crawler.painter.set_type('duplicate_meta_tags', 'success');

    var canonicals = crawler.canonicals,
        tests      = {
            'meta_titles'   : 'Urls have same meta title but different canonicals',
            'descriptions'  : 'Urls have same meta description but different canonicals'
        };

    for(var test in tests){
        for(var x in crawler[test]){
            var urls = crawler[test][x];
            if( urls < 2 ) continue;
            var canonical = default_tests.get_key_from_object(canonicals, urls[0]);
            for( var i in urls )
                if( canonical != default_tests.get_key_from_object(canonicals, urls[i]) ) {
                    var status = crawler.painter.create_status('error', tests[test]);
                    crawler.painter.add_row('duplicate_meta_tags', [urls.join(', '), status]);
                    break;
                }
        }
    }

    return undefined;
});

// When crawler is done check for bad links
crawler.event_handler.on('ALL_CRAWLS_FINISHED', function(){
    crawler.painter.set_type('bad_links', 'success');
    for(var f in crawler.failed){
        var links = default_tests.get_linked_from_links(crawler.failed[f]);
        if( links != false ){
            crawler.painter.add_row('bad_links', [crawler.failed[f], links]);
            crawler.painter.set_type('bad_links', 'error');
        }
    }
    return undefined;
});

// When crawler is done check for redirect links
crawler.event_handler.on('ALL_CRAWLS_FINISHED', function(){
    crawler.painter.set_type('redirect_links', 'success');
    for(var r in crawler.redirects){
        var links = default_tests.get_linked_from_links(r);
        if( links != false ){
            crawler.painter.add_row('redirect_links', [r, links, crawler.redirects[r]]);
            crawler.painter.set_type('redirect_links', 'warning');
        }
    }
    return undefined;
});
