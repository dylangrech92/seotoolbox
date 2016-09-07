function PageAnalyzer(cont, url, mobile){
    $ = jQuery;

    this.cont = cont;
    this.url = url;
    this.mobile = mobile;

    this.init_report = function(){
        this.cont.html('');

        var self    = this,
            url     = location.protocol + '//' + location.hostname + '/seotest/getPageData';

        $.ajax({
            dataType: 'json',
            data:{'u': self.url, 'agent': (self.mobile) ? 'mobile' : 'desktop'},
            url: url,
            success: function(data){
                self.generate_report(data);
            }
        });
    };

    this.generate_report = function(data){
        this.create_google_preview();
        this.create_divider();
        this.create_keyword_analyzer(data);
        this.create_divider();
        this.create_other_tests_box(data);
    };

    this.create_google_preview = function(){
        var page_url_basehref = $('input[name="URLSegment"]').attr('data-prefix'),
            page_url_segment = ( this.url == 'home' ) ? 'home' : '',
            page_title = $('#Form_EditForm_Title').val(),
            page_meta_title = $('#Form_EditForm_MetaTitle').val(),
            page_description = $('#Form_EditForm_MetaDescription').val();

        // build google search preview
        var google_search_url = page_url_basehref + page_url_segment;
        var google_search_description = page_description;

        var search_result_html = '<h3>' + ( page_meta_title ? page_meta_title : page_title )  + '</h3>';
        search_result_html += '<div class="search_url">' + google_search_url + '</div>';
        search_result_html += '<p>' + google_search_description + '</p>';

        this.cont.append($('<div id="search_snippet"></div>').html(search_result_html));
    };

    this.create_keyword_analyzer = function(data){
        var self = this,
            keyword_box = $('<div class="field text"><h3>Keyword Analyzer</h3></div>'),
            middle_col = $('<div class="keyword_search"></div>').appendTo(keyword_box),
            text_box = $('<input type="text" class="text" />').appendTo(middle_col),
            analyze_btn = $('<button class="ss-ui-button ss-ui-button-medium">Analyze</button>').appendTo(middle_col);

        $('<div class="keyword_results"></div>').appendTo(keyword_box);

        analyze_btn.click(function(){
            var results_box = $(this).parents('.field.text').find('.keyword_results'),
                keyword = text_box.val(),
                html = $(data['body']),
                in_h1 = html.find("h1:containsi('"+keyword+"')").length > 0,
                first_p_with_keyword = html.find("p:containsi('"+keyword+"')").first(),
                first_p_tag = html.find('p').first(),
                in_first_paragraph = first_p_tag.html() == first_p_with_keyword.html(),
                word_count = self.get_word_count(data['phrases']),
                density = self.calculate_keyword_density(data['phrases'], keyword, word_count);

            results_box
                .html('')
                .append(self.add_result_label('Keyword in h1', in_h1, 'Yes', 'No'))
                .append(self.add_result_label('Keyword in first p tag', in_first_paragraph, 'Yes', 'No'))
                .append(self.add_result_label('Word Count', true, word_count, ''))
                .append(self.add_result_label('Keyword Density', true, density+'%', ''))
        });

        this.cont.append(keyword_box);
    };

    this.add_result_label = function(title, test, text_true, text_false){
        var span = '<span class="'+(test ? 'green' : 'red')+'">'+(test ? text_true : text_false)+'</span>';
        return '<div><p><strong>'+title+'</strong>'+span+'</p>';
    };

    this.calculate_keyword_density = function(phrases, keyword, word_count){
        var count = 0;
        for(var phrase in phrases) if( phrases[phrase].indexOf(keyword.toLowerCase()) >= 0) count ++;
        return (((count / word_count) * 100) / keyword.split(' ').length).toFixed(2);
    };

    this.get_word_count = function(phrases){
        var count = 0;
        for(var phrase in phrases) count += phrases[phrase].split(' ').length;
        return count;
    };

    this.create_other_tests_box = function(data){
        var html = $(data['body']),
            h1_count = html.find('h1').length,
            h2_count = html.find('h2').length,
            word_count = this.get_word_count(data['field_data']['3']),
            missing_alt_count = this.get_missing_alt_count(html),
            tests_box = $('<div class="field text"><h3>SEO Tests</h3></div>')
                .append(this.add_result_label('H1 count', h1_count == 1, '1', h1_count))
                .append(this.add_result_label('H2 count', h2_count == 1, '1', h2_count))
                .append(this.add_result_label('Article Word Count', word_count >= 700, word_count, word_count))
                .append(this.add_result_label('Images missing alt tag', missing_alt_count <= 0, 0, missing_alt_count));

        this.cont.append(tests_box);
    };

    this.get_missing_alt_count = function(html){
        var count = 0;
        $.each( html.find( 'img' ), function(){ if( !$(this).attr( 'alt' ) ) count++; });
        return count;
    };

    this.create_divider = function(){
        this.cont.append('<hr />');
    };

    this.init_report();
}

// Add a case insensitive version of the contains function
jQuery.extend(jQuery.expr[':'], {
    'containsi': function(elem, i, match, array){
        return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
    }
});
