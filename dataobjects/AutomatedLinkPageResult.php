<?php

class AutomatedLinkPageResult extends DataObject{

    private static $db = array(
        'OriginalLinkCount' => 'INT',
        'LinksCreatedCount' => 'INT',
        'Links'             => 'Text'
    );

    private static $has_one = array(
        'Page' => 'SiteTree'
    );

    private static $summary_fields = array(
        'Title'             => 'Page Title',
        'URLSegment'        => 'Page URLSegment',
        'OriginalLinkCount' => 'Amount of links originally',
        'Links'             => 'List of automated links present',
        'LinkCount'         => 'Amount of links created',
        'TotalLinks'        => 'Total Amount of links'
    );

    // Disable all permissions to this object no one needs to touch it except the code itself
    public function canView($member = null){return true;}
    public function canEdit($member = null){return false;}
    public function canDelete($member = null){return false;}
    public function canCreate($member = null){return false;}

    public function Title(){
        return $this->Page()->Title;
    }

    public function URLSegment(){
        return $this->Page()->Link();
    }

    public function LinkCount(){
        return $this->LinksCreatedCount;
    }

    public function TotalLinks(){
        return $this->OriginalLinkCount + $this->LinksCreatedCount;
    }

    /**
     * If we already have an AutomatedLinkPageResult object for the
     * $page specified update it with the new data else create it
     *
     * @param SiteTree $page
     * @return void
     */
    public static function add_or_update( SiteTree $page ){
        $obj = self::get()->find( 'PageID', $page->ID );
        if( !$obj ) $obj = self::create( array( 'PageID' => $page->ID ) );

        $obj->OriginalLinkCount = $page->OriginalLinkCount;
        $obj->LinksCreatedCount = $page->LinkCount;
        $obj->Links             = $page->Links;

        $obj->write();
    }

    /**
     * Delete the records we have that belong to pages that don't exist
     * anymore
     *
     * @return void
     */
    public static function remove_old_data(){
        foreach( self::get() as $obj ) if( !SiteTree::get()->byID( $obj->PageID ) ) $obj->delete();
    }
}
