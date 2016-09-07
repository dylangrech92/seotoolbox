<?php
/**
 * Plugin: SEOToolbox
 * Author: Dylan Grech
 * Copyright: 2015
 * License: Open GPL License V3.0
 *
 * Add the SEO Toolbox Controller Extension to the Content Controller
 * so it can create the automated links to all the pages
 *
 * Dependencies:
 * - SortableGridField https://github.com/UndefinedOffset/SortableGridField
 *
 * Optional Dependencies:
 * - HTML5 - https://github.com/silverstripe/silverstripe-html5
 *
 * ------------------- Running the report on a cron job ----------------------
 * To a run the report as a cron opposed to the default behavior which is executed
 * in real-time you require to configure 2 things:
 *
 * 1) Update the value of AutomatedLinkReport::run_in_realtime to false
 * Config::inst()->update( 'AutomatedLinkReport', 'run_in_realtime', false );
 *
 * 2) Setup to crontab to run: framework/sake AutomatedLinkReportTask
 * ----------------------------------------------------------------------------
 *
 * -------------------- Running the Crawler --------------------------------
 * To run the crawler which check your whole site for SEO issues similar
 * to what Screaming Frog does but in a more simple fashion simply access:
 * <youdomain.tls>/seotest
 *
 * Note: You need to be logged in and have access to the SEOToolbox Admin panel
 * to view this report.
 */

define( 'SEOTOOLBOX_DIR', str_replace( Director::baseFolder().'/', '', __DIR__ ) );

Config::inst()->update('SEOToolboxAdmin', 'menu_icon', SEOTOOLBOX_DIR.'/admin/icon/seotoolbox-icon.png');
Config::inst()->update('LeftAndMain','extra_requirements_javascript', array(SEOTOOLBOX_DIR.'/js/seo_page_analyzer.js'));
Config::inst()->update('LeftAndMain','extra_requirements_css', array(SEOTOOLBOX_DIR.'/css/seo_page_analyzer.css'));

CMSMenu::add_link('seotest', 'Run Crawler', '/seotest', 9, array('target' => '_blank'));
Requirements::customCSS('.icon.icon-16.icon-seotest{background:url('.SEOTOOLBOX_DIR.'/admin/icon/crawl-icon.png)}');
