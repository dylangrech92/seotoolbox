<?php

class SEOTestSiteTreeController extends Controller{

    private static $sprite_path = null;
    private static $css         = null;

    private static $desktop_user_agent  = 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36';
    private static $mobile_user_agent   = 'Mozilla/5.0 (Linux; <Android Version>; <Build Tag etc.>) AppleWebKit/<WebKit Rev> (KHTML, like Gecko) Chrome/<Chrome Rev> Mobile Safari/<WebKit Rev>';

    // Array of regex that will be used by the crawler. If the url we're going to crawl matches any filter in here, it will be ignored
    private static $ignore_paths = array();

    private static $allowed_actions = array( 'urlsAndSettings', 'getPageData' );

    public function init(){
        parent::init();

        // Check user is logged in and has permission to access to SEO Toolbox Admin
        if (!Member::currentUser()) return $this->redirect(Security::login_url() . '?BackURL=/seotest');
        if (!Permission::check('CMS_ACCESS_SEOToolboxAdmin')) return $this->redirect(self::getPermissionDeniedPage()->Link());

        Requirements::clear();

        // Sprite Location needs to be dynamic as devs can install module in different locations
        $sprite_path = $this->config()->get('sprite_path');
        if ($sprite_path === null) $sprite_path = SEOTOOLBOX_DIR . '/css/icons/icon_sprite.png';
        Requirements::customCSS(".icon{width:16px;height: 16px;cursor:pointer;background: url(/{$sprite_path});}");

        // CSS can be replaced by devs if they desire to change styling
        Requirements::css(SEOTOOLBOX_DIR.'/third-party/bootstrap/css/bootstrap.min.css');
        Requirements::css(SEOTOOLBOX_DIR.'/third-party/bootstrap/css/bootstrap-theme.min.css');
        $css = $this->config()->get('css');
        if ($css === null) $css = array(SEOTOOLBOX_DIR . '/fonts/lato/lato.css', SEOTOOLBOX_DIR . '/css/seotest.css');
        Requirements::combine_files('seotest.css', $css);

//        Requirements::combine_files('seotest.js', array(
//            SEOTOOLBOX_DIR . '/js/jquery-1.12.0.js',
//            SEOTOOLBOX_DIR . '/js/seotest.js'
//        ));

        Requirements::combine_files('seotest.js', array(
            SEOTOOLBOX_DIR . '/js/jquery-1.12.0.js',
            SEOTOOLBOX_DIR . '/js/default_tests.js',
            SEOTOOLBOX_DIR . '/js/crawler.js',
            SEOTOOLBOX_DIR . '/js/crawler_init.js'
        ));
    }

    /**
     * Curl the passed url.
     *
     * This is still run on the same domain as where your admin domain is located
     * however curl can deal with redirects much better then ajax therefore giving a
     * more accurate result. Also it prepares all the important data into an array object
     * which is then encoded and sent to JS for parsing
     *
     * Object Contents
     * obj['header'] = Headers that we got back from the curl
     * obj['body'] = HTML of the page
     * obj['phrases'] = A list of sentences as extracting from the DOM
     * obj['field_data'] = A result from preg_match with all the html fields visible on the page
     *
     * @param SS_HTTPRequest $request
     * @return String
     */
    public function getPageData(SS_HTTPRequest $request){
        $agent  = ( $request->getVar('agent') == 'mobile' )
            ? $this->config()->get('mobile_user_agent')
            : $this->config()->get('desktop_user_agent');

        $curl   = $this->loadPage($request->getVar('u'), $agent);
        $curl['phrases'] = $this->extractWords($curl['body']);

        Requirements::clear();
        return json_encode($curl);
    }

    private function extractWords($html, $get_pure_word_count=false){
        mb_internal_encoding('UTF-8');
        $html = preg_replace_callback(
            "/(&#[0-9]+;)/",
            function($m){return mb_convert_encoding($m[1], "UTF-8", "HTML-ENTITIES");},
            $html
        );
        $html = str_replace(array("\n", "\r"), ' ', mb_strtolower($html));

        if( $get_pure_word_count ) return strip_tags($html);

        $phrases = array();

        $regex_find_replace = array(
            array(
                'find'      => '/<meta(.*?)name="(.*?)description"(.*?)content="(.*?)"(.*?)[>]/m',
                'find_pos'  => 4,
                'replace'   => '/<meta(.*?)[>]/i'
            ),
            array(
                'find'      => '/<(img|a)[^<]*title=(\'|")(.*?)(\'|")[^<]*[>]/m',
                'find_pos'  => 3
            ),
            array(
                'find'      => '/<img[^<]*alt=(\'|")(.*?)(\'|")[^<]*[>]/m',
                'find_pos'  => 2,
                'replace'   => '/<img(.*?)[>]/i'
            ),
            array(
                'find'      => '/<(.*?)>(.*?)<\/[a-zA-Z0-9]++>/m',
                'find_pos'  => 2,
            )
        );

        foreach( $regex_find_replace as $commands ){
            if(isset($commands['find'])){
                preg_match_all( $commands['find'], $html, $matches );
                array_walk($matches[$commands['find_pos']], function(&$phrase){
                    $words = explode(' ', strip_tags($phrase));
                    array_walk($words, function(&$w){
                        $w = trim(preg_replace('/\s+/', ' ', strip_tags($w)));
                    });
                    $phrase = preg_replace('/\s+/', ' ', implode(' ', $words));
                });
                $phrases = array_merge($phrases, $matches[$commands['find_pos']]);
            }

            if(isset($commands['replace']))
                $html = preg_replace($commands['replace'], ' ', $html);
        }

        // Remove the empty elements
        $phrases = array_filter($phrases, function($phrase){return strlen(trim($phrase)) > 0;});
        $count = 0;
        foreach( $phrases as $p ) $count += count(explode(' ', $p));
        return $phrases;
    }

    public function urlsAndSettings( SS_HTTPRequest $request ){
        Requirements::clear();
        return json_encode(array(
            'urls' => SiteTree::get()
                ->exclude( 'ClassName', 'RedirectorPage' )
                ->exclude( 'ClassName', 'ErrorPage' )
                ->map( 'ID', 'AbsoluteLink' )
                ->toArray(),

            'settings' => array(
                'ignore_paths' => $this->config()->get('ignore_paths'),
                'crawl_id'     => GlobalAutoLinkSettings::get_current()->CrawlID
            )
        ));
    }

    private function getHTMLFieldsData($data){
        preg_match_all('/\[\*\*\[(.*?)\]\*\*\[(.*?)\]\*\*\]/im', $data, $matches);
        foreach( $matches[2] as $key => $field_text ){
            $matches[2][$key] = base64_decode($field_text);
            $matches[3][$key] = strip_tags($matches[2][$key]);
        }
        return $matches;
    }

    public function loadPage($url, $agent=null){
        $crawl_id = GlobalAutoLinkSettings::get_current()->CrawlID;
        $ch = curl_init();
        curl_setopt( $ch, CURLOPT_URL, Director::absoluteBaseURL().'/'.$url );
        curl_setopt( $ch, CURLOPT_HEADER, true );
        curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
        curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, true );
        curl_setopt( $ch, CURLOPT_MAXREDIRS, 10 );
        curl_setopt( $ch, CURLOPT_USERAGENT, $agent );
        curl_setopt( $ch, CURLOPT_CONNECTTIMEOUT, 10 );
        curl_setopt( $ch, CURLOPT_TIMEOUT, 30 );
        curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
        curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'X-Crawl-Id: '.$crawl_id ) );
        $data = curl_exec( $ch );

        $header_size = curl_getinfo( $ch, CURLINFO_HEADER_SIZE );
        $header 	 = explode( "\r\n\r\n", substr( $data, 0, $header_size ) );
        array_pop( $header ); // Remove last element as it will always be empty
        $header = array_pop( $header );
        $body   = substr( $data, $header_size );

        curl_close( $ch );

        if( !strpos( $header, ' 200 ' ) )return array( 'headers' => false, 'body' => false );

        $field_data = $this->getHTMLFieldsData($body);
        $body = str_replace($field_data[0], $field_data[2], $body);

        return array( 'headers' => $header, 'body' => $body, 'field_data' => $field_data );
    }

    /**
     * If ErrorPage exists for Error Code 503 return it
     * else create it and return it
     *
     * @return ErrorPage
     */
    public static function getPermissionDeniedPage(){
        $page = ErrorPage::get()->find( 'ErrorCode', 503 );
        if( !$page ){
            $page = ErrorPage::create( array(
                'ErrorCode' => 503,
                'Title'		=> 'Permission Denied'
            ) );
            $page->write();
        }

        return $page;
    }
}
