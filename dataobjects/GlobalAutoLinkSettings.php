<?php
/**
 * Plugin: SEOToolbox
 * Author: Dylan Grech
 * Copyright: 2016
 * License: Open GPL License V3.0
 * 
 * Global Auto Link Settings is a dataobject that is auto-created
 * on dev/build and contains all the global settings for the 
 * automated links
 */
class GlobalAutoLinkSettings extends DataObject{
	
	public static $enabled  = true;
    public static $encoding = 'UTF-8';
	
	private static $db = array(
		'MaxLinksPerPage' => 'INT',
		'ExcludeTags'	  => 'VARCHAR(255)',
		'IncludeIn'		  => 'Text',
		'AddTo'           => 'Text',
        'CrawlID'         => 'VARCHAR(15)'
	);
	
	private static $defaults = array(
		'IncludeIn' => 'Content'
	);

    public static $default_create_config = array(
        'MaxLinksPerPage' => 0,
        'ExcludeTags'     => 'pre,h1,h2,h3,h4,h5,h6',
        'IncludeIn'		  => 'Content'
    );
	
	public function ExcludeTags(){
		return array_unique( explode( ',', str_replace( ' ', '', $this->ExcludeTags ).',a,img,iframe,video,object' ) );
	}
	
	public function IncludeInFields(){
		return explode( ',', str_replace( ' ', '', $this->IncludeIn ) );
	}

    public function requireDefaultRecords() {
        $hasData = self::get()->first();
        if(!$hasData) {
            $obj = self::create(self::$default_create_config);
            $obj->CrawlID = $this->createCrawlID();
            $obj->write();
            DB::alteration_message("Added default records to $className table","created");
        }else{
            if(!$hasData->CrawlID){
                $hasData->CrawlID = $this->createCrawlID();
                $hasData->write();
            }
        }

        parent::requireDefaultRecords();
    }

    private function createCrawlID(){
        $ret   = '';
        $alpha = 'abcdefghijklm[)0123456789(]nopqrstuvwxyz';
        $alpha_len = strlen($alpha);

        while( strlen($ret) < 14)
            $ret .= ( rand(0,1) == 0 ) ? strtoupper($alpha[rand(0, $alpha_len-1)]) : $alpha[rand(0, $alpha_len-1)];

        return $ret;
    }

    /**
     * Returns a list of ClassNames where
     * auto links are allowed in
     * 
     * Note: This function tries to cleanup user input
     * 
     * @return array
     */
     public function AllowedIn(){
        $classes = array_values( ClassInfo::subclassesFor( 'SiteTree' ) );
        if( !$this->AddTo ) return $classes;
        
        $sanitized = explode( ',', str_replace( ' ', '', strtolower( $this->AddTo ) ) );
        
        for( $x = 0; $x < count( $sanitized ); $x++ ){
            $found = false;
            
            foreach( $classes as $class ){
                if( strtolower( $class ) === $sanitized[$x] ){
                    $sanitized[$x] = $class;
                    $found = true;
                    break 1;
                }
            }
            
            if( !$found ) unset( $sanitized[$x] );
        }
        
        return (array) $sanitized;
     }

    /**
     * Gets the current config
     *
     * @return \DataObject
     * @throws \ValidationException
     * @throws null
     */
    public static function get_current(){
        $obj = self::get()->first();
        if( !$obj ){
            self::create(self::$default_create_config)->write();
            self::flush_and_destroy_cache();
        }
        return $obj;
    }
}
