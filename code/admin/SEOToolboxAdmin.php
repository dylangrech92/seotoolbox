<?php
/**
 * Plugin: SEOToolbox
 * Author: Dylan Grech
 * Copyright: 2016
 * License: Open GPL License V3.0
 * 
 * SEO Tool box Admin is a model admin used to control
 * all the automated links and automated link global settings
 * for this site
 */
class SEOToolboxAdmin extends ModelAdmin{
	
	private static $menu_title      = 'SEO Tool box';
	private static $url_segment     = 'seo-tool-box';
	private static $managed_models  = array( 'AutomatedLink' );
    private static $menu_priority   = 10;


	public function getEditForm($id = null, $fields = null) {
		$form = parent::getEditForm( $id, $fields );
		$class = $this->sanitiseClassName($this->modelClass);
		$grid   = $form->Fields()->fieldByName($class);
		$grid->getConfig()->addComponent( new GridFieldSortableRows( 'Priority' ) );
		
		return $form;
	}
}
