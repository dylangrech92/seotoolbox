<?php

/**
 * Class GlobalAutoLinkSettingsTest
 * Run tests to check the GlobalAutoLinkSettings Object and it's functionality
 *
 * @method void assertTrue(boolean $test, string $message)
 */
class GlobalAutoLinkSettingsTest extends SapphireTest {

    public static $fixture_file = 'fixtures/AutomatedLinkTest.yml';

    /**
     * Test Max Links per page
     */
    public function testMaxLinksPerPage(){
        $this->objFromFixture('AutomatedLink','link');
        $this->objFromFixture('AutomatedLink','link2');
        $this->objFromFixture('AutomatedLink','link3');

        $settings = GlobalAutoLinkSettings::get()->first();
        $settings->MaxLinksPerPage = 1;
        $settings->write();

        $page   = AutomatedLinkTest::createPage('<p>Checking if only 1 link is created in phrase, properties, default</p>');
        $links  = AutomatedLinkTest::getLinksFromPage($page);
        $this->assertTrue($links->length === 1, 'Was not suppose to find 1 link. Found '.$links->length);
    }

    /**
     * Test that links are not created inside of exclude tags
     */
    public function testExcludeTags(){
        $settings = GlobalAutoLinkSettings::get()->first();
        $settings->MaxLinksPerPage = 0;
        $settings->write();

        $page = AutomatedLinkTest::createPage(
            '<p>Checking if only 2 links is created in default & phrase</p><h3>not in properties</h3>'
        );
        $links = AutomatedLinkTest::getLinksFromPage($page);
        $this->assertTrue($links->length === 2, 'Was not suppose to find 2 links. Found '.$links->length);
    }

    /**
     * Test that links are included in all the specified fields
     */
    public function testIncludeIn(){
        $settings = GlobalAutoLinkSettings::get()->first();
        $settings->IncludeIn = 'Content, Introduction';
        $settings->write();

        $page = TestPage::create(array(
            'Introduction' => '<div id="introduction">2 links should be created here. properties, phrase</div>',
            'Content' => '<div id="content">1 link should be created here. phrase</div>',
        ));

        $controller = Page_Controller::create($page);
        $controller->invokeWithExtensions('addAutomatedLinks');

        $rendered = $controller->Introduction.$controller->Content;
        $dom = AutomatedLink::constructDOMDocument($rendered);

        // Introduction
        $xpath = new DOMXPath($dom);
        $intro = $xpath->query("//*[@id='introduction']")->item(0);
        $this->assertTrue(
            $intro->getElementsByTagName('a')->length === 2,
            'Was suppose to find 1 link in Introduction'
        );

        // Content
        $xpath = new DOMXPath($dom);
        $intro = $xpath->query("//*[@id='content']")->item(0);
        $this->assertTrue(
            $intro->getElementsByTagName('a')->length === 1,
            'Was suppose to find 1 link in Introduction'
        );
    }
}

/**
 * Simple test page to test settings
 */
class TestPage extends Page implements TestOnly{
    private static $db = array(
        'Introduction' => 'HTMLText'
    );
}


