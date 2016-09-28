<?php

/**
 * Class AutomatedLinkTest
 * Run tests to check the Automated Link Object and it's functionality
 *
 * @method void assertTrue(boolean $test, string $message)
 */
class AutomatedLinkTest extends SapphireTest {

    public static $fixture_file = 'fixtures/AutomatedLinkTest.yml';

    /**
     * Test that links are included in the content field
     */
    public function testInsertion(){
        $this->objFromFixture('AutomatedLink','link');
        $page   = $this->createPage('<p>Checking if phrase is replaced</p>');
        $link   = $this->getLinkFromPage($page);
        $this->assertTrue($link->nodeValue === 'phrase', 'Link wasn\'t created');
    }

    /**
     * Test the individual properties of the automated link
     */
    public function testProperties(){
        $this->objFromFixture('AutomatedLink','link2');

        $page   = $this->createPage('<p>Checking if properties is with correct props</p>');
        $link   = $this->getLinkFromPage($page);

        $this->assertTrue( $link->nodeValue === 'properties', 'Phrase did not match' );
        $this->assertTrue( $link->getAttribute('title') === 'test title', 'Title did not match' );
        $this->assertTrue( $link->getAttribute('href') === '#test-anchor', 'Anchor did not match' );
        $this->assertTrue( $link->getAttribute('target') === '_blank', 'Target did not match' );
        $this->assertTrue( $link->getAttribute('rel') === 'nofollow', 'Rel did not match' );
    }

    /**
     * Test that the default properties match what we expect
     */
    public function testDefaultProperties(){
        $this->objFromFixture('AutomatedLink','link3');

        $page   = $this->createPage('<p>Checking if default is correct</p>');
        $link   = $this->getLinkFromPage($page);
        $auto   = AutomatedLink::get()->find('Phrase', 'default');

        $this->assertTrue( $link->nodeValue === 'default', 'Phrase did not match' );
        $this->assertTrue( $link->getAttribute('title') === '', 'Title did not match' );
        $this->assertTrue( $link->getAttribute('href') === '#', 'href did not match' );
        $this->assertTrue( $link->getAttribute('target') === '', 'Target did not match' );
        $this->assertTrue( $link->getAttribute('rel') === '', 'Rel did not match' );
        $this->assertTrue( (int) $link->getAttribute('data-id') === $auto->ID, 'data-id did not match' );
    }

    /**
     * Test that the default properties match what we expect
     */
    public function testLimitFilter(){
        $this->objFromFixture('AutomatedLink','link3');

        $page   = $this->createPage('<p>Checking if default is created only twice. default default</p>');
        $dom    = $this->getPageDOM($page);
        $links  = $dom->getElementsByTagName('a');
        $this->assertTrue($links->length == 2, 'Was suppose to find 2 link. Found '.$links->length);
    }

    /**
     * Create a DOMDocument out of the $page supplied and
     * check that it only has 1 link.
     * If it does return it, else fail the test
     *
     * @param SiteTree $page
     * @return DOMDocument
     */
    private function getLinkFromPage(SiteTree $page){
        $dom = $this->getPageDOM($page);
        $links = $dom->getElementsByTagName('a');
        $this->assertTrue($links->length == 1, 'Didn\'t find the link that was suppose to be created');
        return ( $links->length != 1 ) ? new DOMElement() : $links->item(0);
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


