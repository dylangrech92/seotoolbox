(function($){
	"use strict";
	
	var seotest = {
		interval            : undefined,
		fetchedUrls         : false,
		started             : false,
		lastAjaxStart       : 0,
		tested              : [],
		que                 : [],
		linksFound          : [],
		dontLoad            : [],
		wrapper             : $( '.wrapper' ),
		toAnalyzeCount      : $( '#leftcount' ),
		analyzedCount       : $( '#donecount' ),
		analyzedStatus      : $( '#analyzestatus' ),
		useragent           : 'mobile',
		titles              : {},
		descriptions        : {},
		sections : [
			[ 'ProblemPages', 'Pages that didn\'t load or lead to external sites', [ 'URL', 'Linked From' ] ],
			[ 'H1', 'Missing H1', [ 'URL' ] ],
			[ 'H1Count', 'Has more then 1 H1', [ 'URL', 'Amount' ] ],
			[ 'H2', 'Missing H2', [ 'URL' ] ],
			[ 'H2Count', 'Amount of H2 <small>Excludes pages that don\'t have h2s</small>', [ 'URL', 'Amount' ] ],
			[ 'WordCount', 'Word count', [ 'URL', 'Count' ] ],
            [ 'ArtWordCount', 'Article Word count', [ 'URL', 'Count' ] ],
			[ 'INTLinkCount', 'Internal link count <small>(In HTMLText Fields)</small>', [ 'URL', 'Count' ] ],
			[ 'INTLinkDensity', 'Internal link density <small>(In HTMLText Fields)</small>', [ 'URL', 'Density' ] ],
			[ 'EXTLinkCount', 'External link count <small>(In HTMLText Fields)</small>', [ 'URL', 'Count' ] ],
			[ 'EXTLinkFollow', 'Has external links that follow <small>(In HTMLText Fields)</small>', [ 'URL', 'Links' ] ],
			[ 'MissingAlt', 'Images missing alt tag', [ 'URL', 'Amount' ] ],
			[ 'NoImageFields', 'Page has HTML Fields without images', [ 'URL', 'Fields' ] ],
			[ 'TitlePresent', 'Missing Meta Title', [ 'URL' ] ],
			[ 'BadTitle', 'Meta Title length is shorter then 40 or longer then 56 characters', [ 'URL', 'Length' ] ],
			[ 'TitleLength', 'Meta Title length', [ 'URL', 'Length' ] ],
			[ 'DescriptionPresent', 'Missing Meta Description', [ 'URL' ] ],
			[ 'BadDescription', 'Meta Description is shorter then 140 or longer then 156 characters', [ 'URL', 'Length' ] ],
			[ 'DescriptionLength', 'Meta Description length', [ 'URL', 'Length' ] ],
			[ 'Canonical', 'Missing Canonical', [ 'URL' ] ],
			[ 'NoIndex', 'Page is no-index', [ 'URL' ] ],
			[ 'LongURL', 'URL is longer then 115 characters', [ 'URL', 'Length' ] ],
			[ 'BadURL', 'URL contains upper-case letters or underscores', [ 'URL' ] ],
			[ 'HrefLang', 'HREF LANG Tags', [ 'URL', 'Tags' ] ],
			[ 'DuplicateTitle', 'Has duplicate meta title tag', [ 'Meta Title', 'URLs' ] ],
			[ 'DuplicateDescription', 'Has duplicate meta description tag', [ 'Meta Description', 'URLs' ] ],
			[ 'OrphanPages', 'Orphan Pages', [ 'URL' ] ],
			[ 'PagesAnalyzed', 'Pages Analyzed', [ 'URL', 'Links found added to que' ] ]
		],
		
		updateStats: function(){
			this.toAnalyzeCount.html( this.que.length );
			this.analyzedCount.html( this.tested.length );
			this.analyzedStatus.html( ( this.que.length > 0 ) ? 'Analyzing' : 'Done' );
		},
		
		testH1: function( url, html ){
			var len = html.find( 'h1' ).length;
			if( len > 1 ) this.createRow( 'H1Count', url, [ len ] );
			if( len < 1 ) this.createRow( 'H1', url );
		},
		
		testH2: function( url, html ){
			var len = html.find( 'h2' ).length;
			if( len > 0 ) this.createRow( 'H2Count', url, [ len ] );
			if( len < 1 ) this.createRow( 'H2', url );
		},
		
		testImages: function( url, html ){
			var count = 0;
			$.each( html.find( 'img' ), function(){ if( !$(this).attr( 'alt' ) ) count++; });
			if( count > 0 ) this.createRow( 'MissingAlt', url, [ count ] );
		},
		
		testMetaTitle: function( url, html ){
			var title       = html.filter( 'title' ),
                canonical   = this.getCanonicalUrl(html);

			if( title.length < 1 ){
				this.createRow( 'TitlePresent', url );
			}else{
				title = title.text();
				this.createRow( 'TitleLength', url, [ title.length ] );
				if( title.length < 0  )	 					  this.createRow( 'TitlePresent', url );
				if( title.length <  40 || title.length > 56 ) this.createRow( 'BadTitle', url, [ title.length ] );
				
				if( this.titles.hasOwnProperty( title ) ){
				    if( canonical != this.titles[title]['canonical'] && !this.inArray(url, this.titles[title]['urls']) )
				        this.titles[ title ]['urls'].push( url );
				}else{
				    this.titles[title] = {'urls': [url], 'canonical': canonical};
                }
			}
		},
		
		checkDuplicateTitles: function(){
			$('.infobox#DuplicateTitle tbody').html('');
			for( var i in this.titles ) if( this.titles[ i ]['urls'].length > 1 )
			    this.createRow( 'DuplicateTitle', false, [ i, this.titles[i]['urls'].join() ] );
		},
		
		testMetaDescription: function( url, html ){
			var desc 		= html.filter( 'meta[name=description]' ),
                canonical   = this.getCanonicalUrl(html);
			
			if( desc.length < 1 ){
				this.createRow( 'DescriptionPresent', url );
			}else{
				desc = desc.attr('content');
				this.createRow( 'DescriptionLength', url, [ desc.length ]  );
				if( desc.length < 0  ) 				    this.createRow( 'DescriptionPresent', url );
				if( desc.length <  140 || desc > 156 )  this.createRow( 'BadDescription', url, [ desc.length ] );

                if( this.descriptions.hasOwnProperty( desc ) ){
                    if( canonical != this.descriptions[desc]['canonical'] && !this.inArray(url, this.descriptions[desc]['urls']) )
                        this.descriptions[ desc ]['urls'].push( url );
                }else{
                    this.descriptions[desc] = {'urls': [url], 'canonical': canonical};
                }
			}
		},
		
		checkDuplicateDescriptions: function(){
			$('.infobox#DuplicateDescription tbody').html('');
			for( var i in this.descriptions )
			    if( this.descriptions[ i ]['urls'].length > 1 )
			        this.createRow( 'DuplicateDescription', false, [ i, this.descriptions[i]['urls'].join() ] );
		},
		
		testCanonical: function( url, result ){
			if( !this.getCanonicalUrl(result) ) this.createRow( 'Canonical', url );
		},

        getCanonicalUrl: function( html ){
            var tags = html.filter( 'link' );
            for( var i = 0; i < tags.length; i++ ) {
                var rel = $(tags[i]).attr('rel');
                if( rel && rel.toLowerCase() === 'canonical' )
                    return $(tags[i]).attr('rel');
            }
            return false;
        },

		updateLinkArray: function( url, result ){
			var 	self  = this,
					links = [];
			$.each( result.find( 'a' ), function(){
				var href = $(this).attr( 'href' );
				if( href ){
					
					// If href is file or external we don't care about it
					if( self.isFileURL( href ) || self.isURLExternal( href ) ) return true;
					
					var santized = self.sanitizeUrl( href ),
						  index  = self.getIndexInLinksFound( santized );
					
					if( index < 0 ) self.linksFound.push( [ santized, url ] );
					else self.linksFound[index][1] += ', ' + url;
					
					// if the link found is tested / qued / didn't load we're done we don't need to do anything else
					if( self.inArray( santized, self.que ) || self.inArray( santized, self.tested ) || self.inArray( santized, self.dontLoad ) ) return true;
					
					self.que.push( santized );
					links.push( santized );
				}
			});
			
			self.createRow( 'PagesAnalyzed', url, [ links.join( ', ' ) ] );
		},
		
		updateOrphanPages: function(){
			$('.infobox#OrphanPages tbody').html('');
			var santized = '';
				  
			for( var i = 0; i < this.tested.length; i++ ){
				santized = this.sanitizeUrl( this.tested[i] );
				if( !this.inArray( santized, this.dontLoad ) && this.getIndexInLinksFound( santized ) < 0 ) this.createRow( 'OrphanPages', this.tested[i] );
			}
		},
		
		getIndexInLinksFound: function( url ){
			for( var x = 0; x < this.linksFound.length; x++ ) if( this.linksFound[x][0] == url ) return x;
			return -1;
		},
		
		updateDontLoadList: function(){
			$('.infobox#ProblemPages tbody').html('');
			for( var i = 0; i < this.dontLoad.length; i++ ){
				var index = this.getIndexInLinksFound( this.dontLoad[i] ),
					  link 	= ( index < 0 ) ? undefined : this.linksFound[ index ];
				
				if( link ) this.createRow( 'ProblemPages', link[0], [ link[1] ] );
				else this.createRow( 'ProblemPages', this.dontLoad[i], [''] );
			}
		},
		
		testURL: function( url ){
			if( url.length > 115 ) this.createRow( 'LongURL', url );
			if( url.toLowerCase() !== url || url.replace('_','') !== url ) this.createRow( 'BadURL', url ); 
		},
		
		testNoIndex: function( url, result ){
			var tags = result.filter( 'meta' );
			for( var i = 0; i < tags.length; i++ ) if( $(tags[i]).attr( 'name' ) && $(tags[i]).attr( 'name' ).toLowerCase() === 'robots' && $(tags[i]).attr('content').toLowerCase().indexOf( 'noindex' ) > -1 ){
				return this.createRow( 'NoIndex', url );
			}
		},
		
		testLangTags: function( url, result ){
			var tags = [];
			$.each( result.filter( 'link' ), function(){
				if( $(this).attr( 'hreflang' ) ) tags.push( seotest.getEscapedHTML( $(this) ) );
			});
			
			if( tags.length > 0 ) this.createRow( 'HrefLang', url, [ tags.join('<br />') ] );
		},
		
		testMissingImagesAndLinks: function( html, field_data, url ){
			var	self	        = seotest,
				external        = [],
				internal        = [],
				externalFollow  = [],
				words           = self.getWordCount( field_data[3] ),
                missing_images  = [];

			// Loop through all HTML fields visible on this page
            for( var field in field_data[2] ) {
                var f = $(field_data[2][field]);

                // Check if this field has images
                if( f.find('img').length < 1 ) missing_images.push(field_data[1][field]);

                // Test Links
                $.each( f.find( 'a' ), function(){
                    var $this   = $(this),
                        link    = $this.attr( 'href' );
                    if( link && !self.isFileURL(link) ){
                        if( !self.isURLExternal( link ) ){
                            internal.push( link );
                        }else{
                            if( $this.attr( 'rel' ) && $this.attr( 'rel' ).toLowerCase().indexOf( 'nofollow' ) > -1 ) external.push( link );
                            else externalFollow.push( link );
                        }
                    }
                });
            }

			self.createRow( 'INTLinkCount', url, [ internal.length ] );
			if( internal.length > 0 ) self.createRow( 'INTLinkDensity', url, [ ( words / internal.length ).toFixed(2) +' words : 1 link' ] );
			if( ( external.length + externalFollow.length ) > 0 ) self.createRow( 'EXTLinkCount', url, [ external.length + externalFollow.length ] );
			if( externalFollow.length > 0 ) self.createRow( 'EXTLinkFollow', url, [ externalFollow.join(', ') ] );
            if( missing_images.length > 0 ) seotest.createRow( 'NoImageFields', url, [missing_images.join(', ')] );
		},

        getWordCount: function(sentences){
            var count = 0;
		    for( var sentence in sentences ) count += sentences[sentence].split(' ').length;
            return count;
        },

		fetchAndTest: function(){
			if( this.que.length < 1 || $.active > 2 ) return;
			
			var self    = this,
				  queid = Math.floor( Math.random() * self.que.length ),
				  url   = self.sanitizeUrl( self.que[ queid ] );
			
			self.que.splice( self.que.indexOf( url ), 1 );
			self.lastAjaxStart = Date.now();
			
			if( !url || self.isFileURL( url ) || self.isURLExternal( url ) ||
                self.inArray( url, self.tested ) || self.ignoreURL( url )
            ) return self.fetchAndTest();
			
			self.tested.push( url );
			
			$.ajax({ 
				url: self.getProxyUrl( url ),
				data: { agent: self.useragent },
			 	accepts: 'json',
			 	dataType: 'json'
			 })
			.done(function( result ) {
                if(result['headers'] && result['body'] && result['body'].toLowerCase().indexOf('<head') >= 0) {

                    var html = $(self.stripImgSrc(result['body'])); // Strip img src attributes to avoid loading images when converting to a jquery object

                    self.testLangTags(url, html);
                    self.testH1(url, html);
                    self.testH2(url, html);
                    self.testImages(url, html);
                    self.testMetaTitle(url, html);
                    self.testMetaDescription(url, html);
                    self.testCanonical(url, html);
                    self.testURL(url);
                    self.testNoIndex(url, html);
                    self.testMissingImagesAndLinks(html, result['field_data'], url);
                    self.createRow('WordCount', url, [self.getWordCount(result['phrases'])]);
                    self.createRow('ArtWordCount', url, [self.getWordCount(result['field_data'][3])]);
                    self.updateLinkArray(url, html);
                }else{
					self.dontLoad.push( url );
                    self.updateDontLoadList();
			    }
			}).fail( function(){
				self.dontLoad.push( url );
			}).always( function(){
				self.updateStats();
				self.fetchAndTest();
			});
		},
		
		fetchURLSAndSettings: function(){
			$.ajax({
				url	        : '/seotest/urlsAndSettings',
				dataType    : 'json',
				success     : function( result ){
					if( !result ) seotest.fetchURLSAndSettings();

                    seotest.globalSettings = result['settings'];

					for( var i in result['urls'] ) seotest.que.push( seotest.sanitizeUrl( result['urls'][i] ) );
					seotest.que = seotest.removeDuplicates( seotest.que );
					seotest.fetchedUrls = true;
				}
			});
		},
		
		getProxyUrl: function( url ){
			return location.protocol + '//' + location.hostname + '/seotest/getPageData?u='+url;
		},
		
		stripImgSrc: function( result ){
			return result.replace( /(src).*?=.*?(['"].*?['"])/ig, '' );
		},
		
		getEscapedHTML: function( obj ){
			return $('<p>').text( obj.clone().wrap('<p>').parent().html() ).html();
		},
		
		isFileURL: function( url ){
			var split = this.sanitizeUrl( url ).split( '.' );
			return split.length > 1 && split.pop().indexOf( 'html' ) < 0; // Contains an extension but it doesn't have html in it
		},
		
		isURLExternal: function( url ){
			if( url[0] == '/' || url[0] == '#' || url.indexOf('://') < 0 )   return false; // Starts with / or # or doesn't have :// in it has to be internal
			if( url == this.sanitizeUrl( url ) ) 								   return false; // If we removed the domain and the url is still the same then it's an internal link without the leading /
			if( this.getURLDomain( url ) == location.hostname ) return false; // The domain is the same the domain we're running this script on
			if( url.indexOf( 'mailto:' ) >= 0 )									   return true; // Skip mailto links
			return true;
		},
		
		getURLDomain: function( url ){
			if( !url ) return '';
			if( url.indexOf("://") > -1 ) return url.split('/')[2].split(':')[0];
		    else return url.split('/')[0].split(':')[0];
		},
		
		sanitizeUrl: function( url ){
            url = url
                .replace(/https?:\/\/[^\/]+/i, '')
                .replace(/^\/|\/$/g, '').split('#')[0];

            if( url.slice(-1) == '?' ) url = url.slice(0, -1);
			if( url.length < 1 ) url = '/';
			
			return url;
		},
		
		removeDuplicates: function( arr ){
			return arr.filter(function(item, pos, self) { return self.indexOf(item) == pos; });
		},
		
		inArray: function( needle, haystack ){
			return haystack.indexOf( needle ) >= 0;
		},
		
		replaceAll: function( str, search, replacement ){
		    return str.replace( new RegExp(search, 'g'), replacement );
		},

        ignoreURL: function( url ){
		    for(var regex in this.globalSettings['ignore_paths']) {
                var reg = new RegExp(this.globalSettings['ignore_paths'], 'i');
                if( url.match(reg) != null ) return true;
		    }

            return false;
        },
		
		createRow: function( field, url, data ){
			field		 = $( '.infobox#'+field );
			var row = '<tr>';
			
			if( url ) row += '<td><a href="'+url+'" target="_blank">'+url+'</a></td>';
			
			if( data ){
				for( var i = 0; i < data.length; i++ ){
					row += '<td>'+data[i]+'</td>'; 
				}
			}
			
			field.find('tbody').append( row + '</tr>' );
			field.find( '.header .count' ).html( field.find( 'tbody tr' ).length );
		},
		
		buildSections: function(){
			for( var i = 0; i < this.sections.length; i++ ){
				
				var columns   = '',
					  colData    = this.sections[i][2];
					  
				for( var x = 0; x < colData.length; x++ ){ columns += '<th>'+colData[x]+'</th>'; }
				
				$( '<div/>', {class: 'infobox', id: this.sections[i][0] } ).append([
					$( '<div/>', { class: 'header' } ).append([
						$( '<div class="count left">0</div>'),
						$( '<h2/>' ).html( this.sections[i][1] ),
						$( '<div/>', { class: 'icon toggle right closed' } ),
						$( '<div/>', { class: 'icon export right' } )
					]),
					$( '<div class="tableCont"><table cellspacing="0" cellpadding="0"><thead><tr>'+columns+'</tr></thead><tbody></tbody></table></div>' ).hide()
				]).appendTo( this.wrapper );
			}
			
			// Toggle Button Handler
			$('.infobox .toggle').click( function(){
				var $this = $(this);
				if( $this.hasClass( 'closed' ) ){
					$this.parents( '.infobox' ).find( '.tableCont' ).slideDown();
					$this.addClass( 'opened' );
					$this.removeClass( 'closed' );
				}else{
					$this.parents( '.infobox' ).find( '.tableCont' ).slideUp();
					$this.addClass( 'closed' );
					$this.removeClass( 'opened' );
				}
			});
			
			// Export Button Handler
			$( '.infobox .export' ).click( function(){
					var $this 			 = $(this),
						  rows 			 = $this.parents( '.infobox' ).first().find( 'table tr' ),
						  csvContent = "data:text/csv;charset=utf-8,",
						  encoded		 = '';
					
					$.each( rows, function(){
						var item = [];
						$.each( $(this).find( 'th, td' ), function(){
							item.push( $(this).text() );
						});
						csvContent += item.join(',') + "\n";
					});
					
					var link = document.createElement( 'a' );
					link.setAttribute( 'href', encodeURI( csvContent ) );
					link.setAttribute( 'download', seotest.replaceAll( $this.parents( '.infobox' ).first().find( 'h2' ).text(), ' ', '-' ) + '.csv' );
					link.click();
				});
		},
		
		buildPopup: function(){
			var button = $( '<button>Start</button>' ).click( function(){
				var $this 		= $(this),
					  parent	= $this.parent(),
					  shade  	= $( '.shader' ); 
				
				seotest.useragent = ( $this.parent().find('input').is(':checked') ) ? 'mobile' : 'desktop';
				
				parent.remove();
				shade.remove();
			
				seotest.setupInterval();
			});
			
			$('body').append([
				$( '<div/>', { class: 'shader' } ),
				$( '<div/>', { class: 'popup' } ).append([
					$( '<h1>SEO Site Analysis</h1>' ),
					$('<input type="checkbox">'),
					$('<label>Use mobile user-agent</label>'),
					button
				])
			]);
		},
		
		setupInterval: function(){
			// Every 1 second check if we had an ajax start within the last 5 seconds if not they hanged so restart it
			this.interval = setInterval( function(){
				if( seotest.que.length > 0 && Date.now() - seotest.lastAjaxStart > 2000 ){
					seotest.fetchAndTest();
				}else{
					if( seotest.que.length < 1 && seotest.fetchedUrls ) window.clearInterval( seotest.interval );
						
					// We're done with the crawling, compute the results that need the whole site data
					seotest.updateOrphanPages();
					seotest.checkDuplicateTitles();
					seotest.checkDuplicateDescriptions();
				}
			}, 1000);
		},

		init: function(){
            this.fetchURLSAndSettings();
			this.buildSections();
			this.buildPopup();
		}
		
	};
	
	// Start the seotest class
	seotest.init();
	
	window.seotest = seotest;
	
})(jQuery);
