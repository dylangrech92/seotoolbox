<?php

/**
 * Class AutomatedLinkReportTask
 * Creates AutomatedLinkPageResult to be used in AutomatedLinkReport
 *
 * @see AutomatedLinkPageResult
 * @see AutomatedLinkReport
 *
 */
class AutomatedLinkReportTask extends Controller {

    private   $GlobalSettings;
    private   $Links;

    private static $exclude_classes = array('RedirectorPage', 'VirtualPage');

    public function index() {
        if (!Director::is_cli()) return 'Please run this controller in CLI';

        libxml_use_internal_errors(true);
        set_time_limit(600);

        $this->checkLinks();

        return array();
    }

    /**
     * Check each page on the site and add the data of the links
     * found in AutomatedLinkPageResult Objects
     *
     * @see AutomatedLinkPageResult
     * @return ArrayList
     */
    public function checkLinks() {
        $data = ArrayList::create();

        $run_in_realtime = Config::inst()->get('AutomatedLinkReport', 'run_in_realtime');

        // Enable this since we will need to render the pages for the report
        Config::inst()->update('SSViewer', 'theme_enabled', true);

        $this->GlobalSettings = GlobalAutoLinkSettings::get_current();
        $this->Links          = AutomatedLink::get()->sort('Priority');
        $includeInFields      = $this->GlobalSettings->IncludeInFields();
        if (!$this->GlobalSettings) {
            user_error('Run dev/build before starting to use SEOToolbox');
            return $data;
        }

        $exclude = Config::inst()->get($this->class, 'exclude_classes');
        $exclude = ($exclude) ? "'".implode("','", $exclude)."'" : '';
        foreach (SiteTree::get()->where("ClassName NOT IN($exclude)") as $page) {
            if (!$this->checkForPossibleLinks($page, $includeInFields)) continue;
            $page = $this->getLinkData($page, $includeInFields);
            if (!$page) continue;

            if (!$run_in_realtime) AutomatedLinkPageResult::add_or_update($page);
            $data->push($page);
        }

        if (!$run_in_realtime) AutomatedLinkPageResult::remove_old_data();

        return $data;
    }

    /**
     * Returns all the data on how the provided $page was
     * affected by automated links
     *
     * @param  SiteTree $page
     * @param  array $includeIn
     *
     * @return SiteTree|false $page
     */
    private function getLinkData(SiteTree $page, array $includeIn) {
        // Set a list of all fields that can have autolinks created in them
        $page->AutomateableFields = ArrayList::create();

        foreach (AutomatedLink::getAllDatabaseFields($page->class) as $field => $type)
            if (in_array($field, $includeIn) &&
                !$page->AutomateableFields->find('DataField', $field) &&
                AutomatedLink::isFieldParsable($page, $field)
            ) $page->AutomateableFields->push(DataObject::create(array('DataField' => $field)));

        // Get data Pre-Automated Links creation
        $withLinks = $this->getPageDOM($page);
        if (!$withLinks) return false;

        $links = $withLinks->getElementsByTagName('a');

        $page->TotalLinks           = $links->length;
        $page->OriginalLinkCount    = $page->TotalLinks;
        $page->LinkCount            = 0;

        // List all automated links that were created in this $page
        $linksUsed = array();
        foreach ($this->Links as $autolink)
            foreach ($links as $link) {
                if ($link->getAttribute('data-id') == $autolink->ID) {
                    $linksUsed[$autolink->ID] = $autolink->Phrase;
                    $page->OriginalLinkCount--;
                    $page->LinkCount++;
                }
            }

        $page->Links = implode(', ', $linksUsed);

        if ($page->LinkCount < 1) return false;

        return $page;
    }

    /**
     * Returns a rendered version of the page supplied
     * creating automated links according inside a DOMDocument
     * object or false if anything fails.
     *
     * @param SiteTree $page
     * @return DOMDocument|false
     */
    private function getPageDOM(SiteTree $page) {
        $controllerClass = $page->class.'_Controller';
        if (!class_exists($controllerClass))  $controllerClass = $page->class.'Controller';
        if (!class_exists($controllerClass)) return false;

        $controller = $controllerClass::create($page);
        $controller->invokeWithExtensions('addAutomatedLinks');

        // Set the fields with possible links into a single variable that
        // will be dumped in the link checker template
        $page->AutomateableText = '';
        foreach ($page->AutomateableFields as $field) {
            $field = $field->DataField;
            $page->AutomateableText .= $page->$field;
        }

        $content = mb_convert_encoding(
            $controller->renderWith('LinkCheckerTemplate'),
            'html-entities',
            GlobalAutoLinkSettings::$encoding
        );

        return (!$content) ? false : AutomatedLink::constructDOMDocument($content);
    }

    /**
     * Checks if the page could have the possibility of automated links
     *
     * @param SiteTree $page
     * @param array $includeIn
     *
     * @return Boolean
     */
    private function checkForPossibleLinks(SiteTree $page, array $includeIn) {
        foreach ($this->Links as $link)
            foreach ($includeIn as $possibleField)
                if (isset($page->$possibleField) && preg_match("/\b{$link->Phrase}\b/i", $page->$possibleField)) return true;

        return false;
    }

}
