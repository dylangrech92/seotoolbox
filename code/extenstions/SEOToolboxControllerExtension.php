<?php
/**
 * Plugin: SEOToolbox
 * Author: Dylan Grech
 * Copyright: 2016
 *
 * SEOtoolbox Controller Extension decorates the Content Controller
 * to add the auotamted links to a page where needed
 *
 * @see AutomatedLink
 */
class SEOToolboxControllerExtension extends Extension {

    /**
     * In here we can perform actions before the here mentioned $field
     * text is parsed and where possible links are created.
     *
     * $html is DOMDocument object of the field mentioned
     *
     * @param DOMDocument $html
     * @param             $field
     */
    public function beforeParseField(DOMDocument $html, $field){
        // Do something here
    }

    private $maxLinksPerPage;
    private $settings       = null;
    private $linkCount      = 0;
    private $addLinks       = true;
    private $excludeTags    = array();
    private $maxLinks       = 0;

    public function index(){
        $this->addAutomatedLinks();

        // If we have a crawl request check the CrawlID so we're sure we didn't hit another SS site running our module
        if( $crawl_id = $this->owner->request->getHeader('X-Crawl-Id') ){
            return( $crawl_id == GlobalAutoLinkSettings::get_current()->CrawlID )
                ? $this->crawl_response()
                : $this->owner->redirect(SEOTestSiteTreeController::getPermissionDeniedPage()->Link());
        }

        return array();
    }

    private function crawl_response(){
        // Encoded version to detect which fields are being used
        $customize = array();
        foreach( Config::inst()->get($this->owner->ClassName, 'db') as $field => $type ){
            if( strtolower( $type ) == 'htmltext' ){
                $data = ($this->owner->hasMethod($field)) ? $this->owner->$field() : $this->owner->$field;
                if( !$data ) {
                    continue;
                }
                $tmp = new HTMLText('tmp');
                $tmp->setValue($data);
                $data = base64_encode($tmp->forTemplate());
                $customize[$field] = "[**[$field]**[$data]**]";
            }
        }

        if (in_array($this->owner->ClassName, ClassInfo::subclassesFor('ErrorPage'))) {
            header("HTTP/1.0 405 Instance of ErrorPage");
            die();
        }

        // Clean out the html before sending it back to minimize response size
        die(
            preg_replace(array(
                '/<style(.*?)[>]/im',
                '/<(script|noscript)(.*?)<\/(script|noscript)[>]/im',
                '/<!--(.*?)-->/im',
            ), '', $this->owner->customise($customize)->render())
        );
    }

    /**
     * Get the global settings and check if we should be adding
     * links to this page
     *
     * @return GlobalAutoLinkSettings
     */
    private function getSettings() {
        if ($this->settings === null) {
            $this->settings = GlobalAutoLinkSettings::get_current();
            if (!$this->settings) return $this->addLinks = false;

            $this->excludeTags = (array) $this->settings->ExcludeTags();
            $this->maxLinks = (int) ($this->settings->MaxLinksPerPage) ? $this->settings->MaxLinksPerPage : PHP_INT_MAX;

            if (!in_array($this->owner->ClassName, $this->settings->AllowedIn())) $this->addLinks = false;
        }

        return $this->settings;
    }

    /**
     * Goes through all the automated link settings and adds
     * the links where necessary
     *
     * @return void
     */
    public function addAutomatedLinks(){
        if( GlobalAutoLinkSettings::$enabled && $this->owner->class != 'RedirectorPage' ) {
            $this->getSettings();
            if( !$this->addLinks ) {
                return;
            }

            foreach( $this->getSettings()->IncludeInFields() as $field ){
                // Check that the field provided by user exists in this object, is of type HTMLText and has content
                if( AutomatedLink::isFieldParsable( $this->owner->data(), $field ) ){

                    // Create dummy object so we can parse the HTML
                    $dummy = new HTMLText( $field );
                    $dummy->setValue( $this->owner->$field );
                    // Create DOMDocument Object
                    $content = mb_convert_encoding( $dummy->forTemplate(), 'html-entities', GlobalAutoLinkSettings::$encoding );

                    if( class_exists( 'HTML5_Parser' ) ){
                        $dom = HTML5_Parser::parse( $content );
                    } else{
                        $dom = new DOMDocument();
                        $dom->loadHTML( $content );
                    }

                    // Check current link count and if it's already exceeded do nothing
                    $this->linkCount += (int) $dom->getElementsByTagName( 'a' )->length;
                    if( $this->linkCount >= $this->maxLinks ) {
                        return;
                    }

                    $parsed = $this->parseField( $dom, $field );
                    $this->owner->data()->$field = $parsed;
                    $this->owner->$field         = $parsed;
                }
            }
        }
    }

    /**
     * Parse the provided field and add the necessary links
     *
     * @param DOMDocument $html
     * @param String $field
     * @return string
     */
    private function parseField( DOMDocument $html, $field ){
        $this->owner->extend( 'beforeParseField', $html, $field );

        // Remove Tags from Content we wown't be using
        $excluded = array();
        foreach( $this->excludeTags as $eTag ){
            while( $tags = $html->getElementsByTagName( $eTag ) ){
                if( !$tags->length ) break 1;
                $tag	= $tags->item(0);
                $value  = $html->saveHTML( $tag );
                $key    = (string) crc32( $value );

                // Convert back children nodes of this node if they were already hashed
                $excluded[$key] = str_replace( array_keys( $excluded ), array_values( $excluded ), $value );

                $tag->parentNode->replaceChild( $html->createTextNode( $key ), $tag );
            }
        }

        $body    = (string)$html->saveHTML( $html->getElementsByTagName('body')->item(0) );
        $content = preg_replace( array( '/\<body\>/is', '/\<\/body\>/is' ), '', $body, 1 );

        // Create the links
        $links = AutomatedLink::get()->sort('Priority');
        foreach( $links as $link ){
            // Check if self-linking is allowed and if current pagetype is allowed
            if( !$link->canBeAdded( $this->owner, $field ) ) continue;

            $max    = (int) ( $link->MaxLinksPerPage > 0 ) ? $link->MaxLinksPerPage : PHP_INT_MAX;
            $escape = (string) preg_quote( $link->Phrase, '/' );
            $regex  = (string) ( $link->CaseSensitive ) ? "/(\b{$escape}\b)/" : "/(\b{$escape}\b)/i";

            // Count the matches
            preg_match_all( $regex, $content, $count );
            $count = ( is_array( $count ) && isset( $count[0] ) ) ? count( $count[0] ) : 0;
            if( $count < 1 ) continue;

            if( isset( $this->maxLinksPerPage[ $link->ID ] ) )
                $max -= $this->maxLinksPerPage[ $link->ID ];
            else
                $this->maxLinksPerPage[ $link->ID ] = 0;

            for( $x = 0; $x < $count; $x++ ){
                // Stop adding links if we reached the link or page limit
                if( $x >= $max || $this->linkCount >= $this->maxLinks ) break;

                // Check if there is anything else to replace else stop
                preg_match( $regex, $content, $match );
                if( !is_array( $match ) || !count( $match ) ) break;

                if( !$html = (string) $link->getHTML( $match[0] ) ) continue;
                $key              = (string) crc32( $html );
                $excluded[ $key ] = (string) $html;

                $content = preg_replace( $regex, $key, $content, 1 );
                $this->linkCount++;
                $this->maxLinksPerPage[ $link->ID ]++;
            }

            // Stop Adding links if we reached the page limit
            if( $this->linkCount >= $this->maxLinks ) break;
        }

        // Re-add the excluded Tags
        $content = str_replace( array_keys( $excluded ), array_values( $excluded ), $content );

        return $content;
    }
}
