<?php
/**
 * Plugin: SEOToolbox
 * Author: Dylan Grech
 * Copyright: 2016
 *
 * Automated Link Report is a report that lists all automated
 * links and how they affect the website
 */
class AutomatedLinkReport extends SS_Report{

    protected $title       = 'Automated Link Report';
    protected $description = 'Shows a list of all automated links and how they affect the site';

    // Configs
    private static $run_in_realtime = true;

    public function Title(){
        return (string) $this->title;
    }

    public function columns(){
        return array(
            'Title'              => array(
                'title' => 'Page Title',
                'link' => true,
            ),
            'URLSegment'        => 'Page URLSegment',
            'OriginalLinkCount' => 'Amount of links originally',
            'Links'             => 'List of automated links present',
            'LinkCount'         => 'Amount of links created',
            'TotalLinks'        => 'Total Amount of links'
        );
    }

    public function sourceRecords( $params, $sort, $limit ){
        if( !Config::inst()->get( $this->class, 'run_in_realtime' ) ) {
            return AutomatedLinkPageResult::get();
        }

        $task = new AutomatedLinkReportTask();
        return $task->checkLinks();
    }

    public function getReportField() {
        $gridField = parent::getReportField();

        $gridField->setModelClass('reportTotalBookings');

        $gridConfig = $gridField->getConfig();

        $gridConfig->removeComponentsByType('GridFieldPrintButton');
        $gridConfig->removeComponentsByType('GridFieldExportButton');

        $gridConfig->addComponents (
            new GridFieldPrintAllAutomatedLinksButton('buttons-after-left'),
            new GridFieldExportAllAutomatedLinksButton('buttons-after-left')
        );

        return $gridField;
    }
}
