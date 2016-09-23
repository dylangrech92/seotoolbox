/**
 * Example callback:
 * callback: function(cont, url, html, headers, field_data, phrases){
            return crawler.add_row('h1count', html.find( 'h1' ).length);
        }
 *
 */
const default_tests = [
    {
        name : 'h1_info',
        title: 'H1 INFO',
        headers: ['URL', 'Count', 'Text', 'Status'],
        callback: function(cont, url, html){
            var h1      = html.find( 'h1' ),
                link    = crawler_painter.create_link(url, url),
                joined  = [], status  = undefined;

            h1.each(function(){ joined.push(this.innerHTML); });

            if(h1.length != 1)
                status = crawler_painter.create_status('error', (h1.length < 1) ? 'Missing H1' : 'Multiple H1 tags');
            else status = crawler_painter.create_status('success', 'OK!');

            crawler_painter.add_row(this.name, [link, h1.length, joined.join(', '), status]);
        }
    },

    {
        name : 'h2_info',
        title: 'H2 INFO',
        headers: ['URL', 'Count', 'Text', 'Status'],
        callback: function(cont, url, html){
            var h2      = html.find( 'h2' ),
                link    = crawler_painter.create_link(url, url),
                joined  = [], status = undefined;

            h2.each(function(){ joined.push(this.innerHTML); });

            if(h2.length < 1) status = crawler_painter.create_status('warning', 'Missing H2');
            else status = crawler_painter.create_status('success', 'OK!');

            crawler_painter.add_row(this.name, [link, h2.length, joined.join(', '), status]);
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
                    if(href && !crawler.is_external(href)) art_links.push(href);
                });
            }

            // Full page links
            $.each(html.find('a'), function () {
                var href = $(this).attr('href');
                if(href && !crawler.is_external(href)) links.push(href);
            });

            var art_word_count  = crawler.get_word_count(field_data[3]),
                art_density     = (art_links.length > 0) ? art_word_count / art_links.length : false,
                art_dens_text   = (art_density != false) ? art_density.toFixed(2) +' words : 1 link' : 'No internal links',
                word_count      = crawler.get_word_count(phrases),
                density         = (links.length > 0) ? word_count / links.length : false,
                dens_text       = (density != false) ? density.toFixed(2) +' words : 1 link' : 'No internal links',
                status          = undefined;

            if( art_density < 100 || density < 25 )
                status = crawler_painter.create_status('warning', 'This page might be considered spammy');

            if(links.length > 0)
                crawler_painter.add_row( this.name, [
                    link, art_links.join('<br />'), art_links.length, art_dens_text, links.length, dens_text, status
                ]);
        }
    },

    {
        name : 'ext_link_info',
        title: 'EXTERNAL LINK INFO',
        headers: ['URL', 'External Link Count', 'External Links', 'Follow Links Count', 'Follow Links', 'Status'],
        type: 'success',
        callback: function(cont, url, html, headers, field_data){
            var link = crawler_painter.create_link(url, url),
                links = [], follow = [], status = '';

            for( var field in field_data[2] ) {
                $.each($(field_data[2][field]).find('a'), function () {
                    var $this = $(this),
                        href = $this.attr('href');
                    if(href && crawler.is_external(href)){
                        links.push(href);
                        if(!$this.attr('rel') || $this.attr('rel').toLowerCase().indexOf('nofollow') < 0)
                            follow.push(href);
                    }
                });
            }

            if(follow.length > 0) status = crawler_painter.create_status('warning', 'Page has follow links');
            if(links.length > 0)
                crawler_painter.add_row(
                    this.name,
                    [link, links.length, links.join('<br />'), follow.length, follow.join('<br />'), status]
                );
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
                    (fields.length > 1) ? fields.join(' and ') + 'are missing images' : fields[0] + ' is missing images');
            else if(title > 0)
                status = crawler_painter.create_status('info',
                    (title > 1) ? title + ' images missing title tag' : '1 image is missing title tag');
            else
                status = crawler_painter.create_status('success', 'OK!');

            crawler_painter.add_row(this.name, [link, imgs.length, alt, title, fields.join(', '), status]);
        }
    },

    {
        name: 'title_info',
        title: 'META TITLE',
        headers: ['URL', 'Meta Title', 'Length', 'Status'],
        callback: function(cont, url, html){
            var title = html.filter( 'title' ),
                link  = crawler_painter.create_link(url, url),
                text  = '', len = 0, status = undefined;

            if( title.length > 1 ){
                text = 'Multiple Titles';
                len  = 'N/A';
                status = crawler_painter.create_status('error', 'Multiple title tags');
            }else if( title.length < 1 ){
                status = crawler_painter.create_status('error', 'Missing title tag');
            }else{
                text = title.html();
                len = text.length;
                if(len < 40) status = crawler_painter.create_status('warning', 'Meta title is too short');
                else if(len > 56) status = crawler_painter.create_status('warning', 'Meta title is too long');
                else status = crawler_painter.create_status('success', 'OK!');
            }

            crawler_painter.add_row(this.name, [link, text, len, status]);
            if(!crawler.hasOwnProperty('meta_titles')) crawler.meta_titles = {};
            if(!crawler.meta_titles.hasOwnProperty(text)) crawler.meta_titles[text] = [url];
            else crawler.meta_titles[text].push(url);
        }
    },

    {
        name: 'description_info',
        title: 'META DESCRIPTION',
        headers: ['URL', 'Meta Description', 'Length', 'Status'],
        callback: function(cont, url, html){
            var desc = html.filter( 'meta[name=description]' ),
                link  = crawler_painter.create_link(url, url),
                text  = '', len = 0, status = undefined;

            if( desc.length > 1 ){
                text = 'Multiple Meta Descriptions';
                len  = 'N/A';
                status = crawler_painter.create_status('error', 'Multiple meta description tags');
            }else if( desc.length < 1 ){
                status = crawler_painter.create_status('error', 'Missing meta description tag');
            }else{
                text = desc.attr('content');
                len = text.length;
                if(len < 140) status = crawler_painter.create_status('warning', 'Meta description is too short');
                else if(len > 156) status = crawler_painter.create_status('warning', 'Meta description is too long');
                else status = crawler_painter.create_status('success', 'OK!');

                if(!crawler.hasOwnProperty('descriptions')) crawler.descriptions = {};
                if(!crawler.descriptions.hasOwnProperty(text)) crawler.descriptions[text] = [url];
                else crawler.descriptions[text].push(url);
            }

            crawler_painter.add_row(this.name, [link, text, len, status]);
        }
    },

    {
        name: 'canonical_info',
        title: 'PAGES MISSING CANONICAL',
        headers: ['URL'],
        type: 'success',
        callback: function(cont, url, html){
            var tags = html.filter( 'link' ),
                canonical = undefined;

            for( var i = 0; i < tags.length; i++ ) {
                var rel = $(tags[i]).attr('rel');
                if( rel && rel.toLowerCase() === 'canonical' ) {
                    canonical = $(tags[i]).attr('rel');
                    break;
                }
            }

            if(canonical === undefined || canonical.length < 1) {
                crawler_painter.add_row(this.name, [crawler_painter.create_link(url, url)]);
                crawler_painter.set_type(this.name, 'error');
            }

            canonical = url; // What Google will do
            if(!crawler.hasOwnProperty('canonicals')) crawler.canonicals = {};
            if(!crawler.canonicals.hasOwnProperty(canonical)) crawler.canonicals[canonical] = [url];
            else crawler.canonicals[canonical].push(url);
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
        }
    },

    {
        name: 'urls_test',
        title: 'URL STRUCTURE',
        headers: ['URL', 'Status'],
        type: 'success',
        callback: function(cont, url){
            var link = crawler_painter.create_link(url, url),
                type = 'warning',
                msg  = 'OK!';

            if( url.length > 115 )                  msg = 'URL is too long';
            else if( url.toLowerCase() != url )     msg = 'URL is not in lower case';
            else if( url.replace('_','') !== url )  msg = 'URL contains under scores';
            else return true;

            crawler_painter.add_row(this.name, [link, crawler_painter.create_status(type, msg)]);
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
            }
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
        }
    },

    {
        name: 'orphan_pages',
        title: 'ORPHAN PAGES',
        headers: ['URL'],
        type: 'success',
        callback: function(){
            crawler_painter.reset_table(this.name, 'success');

            pages_loop:
            for( var i in crawler.tested ){
                var url = crawler.tested[i];
                if( crawler.linked_from.hasOwnProperty(url) ) {
                    for (var x in crawler.linked_from[url])
                        if (crawler.linked_from[url][x] != url) continue pages_loop;
                }

                crawler.add_row(this.name, [crawler_painter.create_link(crawler.tested[i], crawler.tested[i])]);
                crawler_painter.set_type(this.name, 'error');
            }
        }
    }
];
