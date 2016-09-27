<?php
/**
 * Plugin: SEOToolbox
 * Author: Dylan Grech
 * Copyright: 2016
 *
 */

define( 'SEOTOOLBOX_DIR', str_replace( Director::baseFolder().'/', '', __DIR__ ) );

Config::inst()->update('SEOToolboxAdmin', 'menu_icon', SEOTOOLBOX_DIR.'/code/admin/icon/seotoolbox-icon.png');
Config::inst()->update('LeftAndMain','extra_requirements_javascript', array(SEOTOOLBOX_DIR.'/js/seo_page_analyzer.js'));
Config::inst()->update('LeftAndMain','extra_requirements_css', array(SEOTOOLBOX_DIR.'/css/seo_page_analyzer.css'));

CMSMenu::add_link('seotest', 'Run Crawler', '/seotest', 9, array('target' => '_blank'));
Requirements::customCSS('.icon.icon-16.icon-seotest{background:url('.SEOTOOLBOX_DIR.'/code/admin/icon/crawl-icon.png)}');

if(Director::is_cli()){
    Config::inst()->update('Director', 'environment_type', 'dev');
}
