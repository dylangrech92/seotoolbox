function PageAnalyzer(cont, url){
    $ = jQuery;

    this.cont       = cont;
    this.url        = url;
    this.data       = {'desktop': undefined, 'mobile': undefined};
    this.preview    = {'desktop': undefined, 'mobile': undefined};

    this.create_google_preview = function(agent){
        this.preview[agent] = $('<div class="search_snippet"></div>')
            .append('<div class="g gtitle"></div><div class="g gurl"></div><div class="g gdesc"></div>');
        return this.preview[agent];
    };

    this.meta_data_handler = function(){
        var self = this;

        $('#Form_EditForm_Title, #Form_EditForm_MetaTitle, #Form_EditForm_MetaDescription, input[name="URLSegment"]').change(function(){
            var title   = $('#Form_EditForm_MetaTitle').val() || $('#Form_EditForm_Title').val(),
                url     = $('input[name="URLSegment"]').attr('data-prefix') + self.url,
                desc    = $('#Form_EditForm_MetaDescription').val();

            for(var agent in self.preview){
                self.preview[agent].find('.gtitle').html(title);
                self.preview[agent].find('.gurl').html(self.truncate(url, 115));
                self.preview[agent].find('.gdesc').html(self.truncate(desc, (agent) == 'mobile' ? 120 : 156));
            }
        });

        $('#Form_EditForm_Title').trigger('change');
    };

    this.truncate = function(text, limit){
        return (text.length > limit) ? text.substr(0, limit-2) + '...' : text;
    },

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

    this.create_other_tests_box = function(data, cont){
        var html = $(data['body']),
            h1_count = html.find('h1').length,
            h2_count = html.find('h2').length,
            word_count = this.get_word_count(data['field_data']['3']),
            missing_alt_count = this.get_missing_alt_count(html);

            cont
                .append(this.add_result_label('H1 count', h1_count == 1, '1', h1_count))
                .append(this.add_result_label('H2 count', h2_count == 1, '1', h2_count))
                .append(this.add_result_label('Article Word Count', word_count >= 700, word_count, word_count))
                .append(this.add_result_label('Images missing alt tag', missing_alt_count <= 0, 0, missing_alt_count));

    };

    this.get_missing_alt_count = function(html){
        var count = 0;
        $.each( html.find( 'img' ), function(){ if( !$(this).attr( 'alt' ) ) count++; });
        return count;
    };

    this.create_layout = function(title, extraCSS){
        extraCSS = (extraCSS) ? extraCSS : '';
        return $('<div class="result_side_cont '+title.toLowerCase()+' '+extraCSS+'"></div>')
            .append($('<h3>'+title+'</h3>'))
            .append($('<div class="field text"></div>'));
    };

    this.create_keyword_search_box = function(){
        var self        = this,
            agents      = ['desktop', 'mobile'],
            keyword_box = $('<div class="field text"></div>'),
            middle_col  = $('<div class="keyword_search"></div>').appendTo(keyword_box),
            text_box    = $('<input type="text" class="text" />').appendTo(middle_col),
            analyze_btn = $('<button class="ss-ui-button ss-ui-button-medium">Analyze</button>').appendTo(middle_col);

        analyze_btn.click(function(e){
            e.preventDefault();

            if( self.data['desktop'] === undefined || self.data['mobile'] === undefined ) return true;

            $('.keyword_result').remove();

            for(var i in agents){
                var data = self.data[agents[i]],
                    layout  = self.create_layout(agents[i].capitalize()).addClass('keyword_result'),
                    results_box = layout.find('.field.text'),
                    keyword = text_box.val(),
                    html = $(data['body']),
                    in_h1 = html.find("h1:containsi('"+keyword+"')").length > 0,
                    first_p_with_keyword = html.find("p:containsi('"+keyword+"')").first(),
                    first_p_tag = html.find('p').first(),
                    in_first_paragraph = first_p_tag.html() == first_p_with_keyword.html(),
                    word_count = self.get_word_count(data['phrases']),
                    density = self.calculate_keyword_density(data['phrases'], keyword, word_count);

                results_box
                    .append(self.add_result_label('Keyword in h1', in_h1, 'Yes', 'No'))
                    .append(self.add_result_label('Keyword in first p tag', in_first_paragraph, 'Yes', 'No'))
                    .append(self.add_result_label('Word Count', true, word_count, ''))
                    .append(self.add_result_label('Keyword Density', true, density+'%', ''));

                self.cont.append(layout);
            }

            return false;
        });

        return keyword_box;
    };

    this.init = function(){
        // Google Preview Section
        this.cont.append('<h2>Google Preview</h2>');
        var preview_d   = this.create_layout('Desktop', 'google').appendTo(this.cont),
            preview_m   = this.create_layout('Mobile', 'google').appendTo(this.cont);
        preview_d.find('.field.text').append(this.create_google_preview('desktop'));
        preview_m.find('.field.text').append(this.create_google_preview('mobile'));
        this.meta_data_handler();

        // Tests Section
        this.cont.append('<h2>SEO Tests</h2>');
        var tests_d = this.create_layout('Desktop').appendTo(this.cont),
            tests_m = this.create_layout('Mobile').appendTo(this.cont);

        // Keywords Section
        this.cont.append('<h2>Keywords Analyzer</h2>');
        this.cont.append(this.create_keyword_search_box());

        this.send_ajax('mobile', tests_m.find('.field.text'));
        this.send_ajax('desktop', tests_d.find('.field.text'));
    };

    this.send_ajax = function(agent, cont){
        var self = this;
        $.ajax({
            dataType: 'json',
            data: {'u': self.url, 'agent': agent},
            url: location.protocol + '//' + location.hostname + '/seotest/getPageData',
            success: function (data) {
                self.data[agent] = data;
                self.create_other_tests_box(data, cont);
            }
        });
    };

    this.init();
}

// Add a case insensitive version of the contains function
jQuery.extend(jQuery.expr[':'], {
    'containsi': function(elem, i, match){
        return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
    }
});

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
