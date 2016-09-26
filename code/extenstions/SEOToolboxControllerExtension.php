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
        $dbFields  = Config::inst()->get($this->owner->ClassName, 'db');
        if(is_array($dbFields)) {
            foreach ( $dbFields as $field => $type) {
                if (strtolower($type) == 'htmltext') {
                    $data = ($this->owner->hasMethod($field)) ? $this->owner->$field() : $this->owner->$field;
                    if($data){
                        $tmp = new HTMLText('tmp');
                        $tmp->setValue($data);
                        $data = base64_encode($tmp->forTemplate());
                        $customize[$field] = "[**[$field]**[$data]**]";
                    }
                }
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
     * @return GlobalAutoLinkSettings|false
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
                    $dom = AutomatedLink::constructDOMDocument($content);

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
     * Goes through $tags and replaces them in $html with a hash of themselves.
     * Returns an array of hash keys used and the original value
     *
     * @param DOMDocument $html
     * @param array $hash_tags
     * @return array
     */
    private function hashTags( DOMDocument $html, $hash_tags ){
        $excluded = array();
        foreach( $hash_tags as $eTag ){
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

        return $excluded;
    }

    /**
     * Adds the passed automated link to $content if possible.
     * Returns an array of hashed that have been added and the original value that was replaced
     *
     * @param AutomatedLink $link
     * @param string $content
     * @return array
     */
    public function addLinkToContent(AutomatedLink $link, &$content){
        $links  = array();
        $max    = (int) ( $link->MaxLinksPerPage > 0 ) ? $link->MaxLinksPerPage : PHP_INT_MAX;
        $escape = (string) preg_quote( $link->Phrase, '/' );
        $regex  = (string) ( $link->CaseSensitive ) ? "/(\b{$escape}\b)/" : "/(\b{$escape}\b)/i";

        // Count the matches
        preg_match_all( $regex, $content, $count );
        $count = ( is_array( $count ) && isset( $count[0] ) ) ? count( $count[0] ) : 0;
        if( $count < 1 ) $links;

        if( isset( $this->maxLinksPerPage[ $link->ID ] ) ) {
            $max -= $this->maxLinksPerPage[$link->ID];
        } else {
            $this->maxLinksPerPage[$link->ID] = 0;
        }

        for( $x = 0; $x < $count; $x++ ){
            // Stop adding links if we reached the link or page limit
            if( $x >= $max || $this->linkCount >= $this->maxLinks ) break;

            // Check if there is anything else to replace else stop
            preg_match( $regex, $content, $match );
            if( !is_array( $match ) || !count( $match ) ) break;

            if( !$html = (string) $link->getHTML( $match[0] ) ) continue;
            $key            = (string) crc32( $html );
            $links[ $key ]  = (string) $html;

            $content = preg_replace( $regex, $key, $content, 1 );
            $this->linkCount++;
            $this->maxLinksPerPage[ $link->ID ]++;
        }

        return $links;
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
        $excluded   = $this->hashTags($html, $this->excludeTags);
        $body       = (string)$html->saveHTML( $html->getElementsByTagName('body')->item(0) );
        $content    = preg_replace( array( '/\<body\>/is', '/\<\/body\>/is' ), '', $body, 1 );

        foreach( AutomatedLink::get()->sort('Priority') as $link){
            if( $this->linkCount < $this->maxLinks && $link->canBeAdded( $this->owner, $field ) ) {
                $links = $this->addLinkToContent($link, $content);
                if( is_array($links) && count($links) > 0 ) {
                    $excluded = $excluded + $links;
                }
            }
        }

        // Re-add the excluded Tags
        return str_replace( array_keys( $excluded ), array_values( $excluded ), $content );
    }
}
