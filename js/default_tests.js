/**
 * Example callback:
 * callback: function(cont, url, html, headers, field_data, phrases){
            return crawler.add_row('h1count', html.find( 'h1' ).length);
        }
 *
 */
const default_tests = [
    {
        name : 'missing_h1',
        title: 'URLS MISSING H1',
        headers: ['URL'],
        type: 'error',
        callback: function(cont, url, html){
            var link = crawler_painer.create_link(url);
            if(html.find( 'h1' ).length < 1) crawler_painer.add_row(this.name, [link]);
        }
    },

    {
        name : 'h1_info',
        title: 'H1 INFO',
        headers: ['URL', 'Count', 'Text'],
        type: 'info',
        callback: function(cont, url, html){
            var h1 = html.find( 'h1' ),
                link = crawler_painer.create_link(url);

            if(h1.length){
                var joined = [];
                h1.each(function(){ joined.push(this.innerHTML); });
                crawler_painer.add_row(this.name, [link, h1.length, joined.join(', ')]);
            }
        }
    },

    {
        name : 'missing_h2',
        title: 'URLS MISSING H2',
        headers: ['URL'],
        type: 'error',
        callback: function(cont, url, html){
            var link = crawler_painer.create_link(url);
            if(html.find( 'h2' ).length < 1) crawler_painer.add_row(this.name, [link]);
        }
    },

    {
        name : 'h2_info',
        title: 'H2 INFO',
        headers: ['URL', 'Count', 'Text'],
        type: 'info',
        callback: function(cont, url, html){
            var h2 = html.find( 'h2' ),
                link = crawler_painer.create_link(url);

            if(h2.length){
                var joined = [];
                h2.each(function(){ joined.push(this.innerHTML); });
                crawler_painer.add_row(this.name, [link, h2.length, joined.join(', ')]);
            }
        }
    },

    {
        name : 'word_count',
        title: 'WORD COUNT',
        headers: ['URL', 'Word Count', 'Article Word Count'],
        type: 'info',
        callback: function(cont, url, html, headers, field_data, phrases){
            var link        = crawler_painer.create_link(url),
                word_count  = crawler.get_word_count(phrases),
                art_count   = crawler.get_word_count(field_data[3]);

            crawler_painer.add_row(this.name, [link, word_count, art_count]);
        }
    },
];
