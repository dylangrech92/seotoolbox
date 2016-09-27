<?php

class AutomatedLinkTest extends SapphireTest {

    public static $fixture_file = 'fixtures/AutomatedLinkTest.yml';

    public function testInsertion(){
        $this->objFromFixture('AutomatedLink','link1');

        $page   = $this->createPage('test-1', '<p>Checking if phrase is replaced</p>');
        $dom    = $this->getPageDOM($page);
        $links  = $dom->getElementsByTagName('a');

        $this->assertTrue($links->length == 1);

        if($links->length == 1){
            $link = $links->item(0);
            $this->assertTrue( $link->getAttribute('title') == 'title 1' );
            $this->assertTrue( $link->getAttribute('target') == '_blank' );
            $this->assertTrue( $link->getAttribute('rel') == '' );
        }
    }

    /**
     * Create a dummy object for testing functionality on the SiteTree
     *
     * @param string|null $content
     * @return Page
     */
    private function createPage($content=null){
        $page = Page::create(array( 'Content' => $content ));
        $page->write();
        return $page;
    }

    /**
     * Render the $page supplied into a DOMDocument object
     *
     * @param Page $page
     * @return DOMDocument
     */
    private function getPageDOM(Page $page){
        $controller = Page_Controller::create($page);
        $controller->invokeWithExtensions('addAutomatedLinks');
        return AutomatedLink::constructDOMDocument($controller->Content);
    }
}


