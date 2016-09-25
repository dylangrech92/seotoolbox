<?php
/**
 * Plugin: SEOToolbox
 * Author: Dylan Grech
 * Copyright: 2016
 *
 * Automated Link is a dataobject that contains all the data
 * about a link that should be created automatically to a page
 *
 * @method SiteTree|null Page()
 * @property string Phrase
 * @property string TitleTag
 * @property string AnchorTag
 * @property boolean NewWindow
 * @property boolean NoFollow
 * @property boolean SelfLinking
 * @property boolean CaseSensitive
 * @property int MaxLinksPerPage
 * @property int Priority
 * @property int PageID
 */
class AutomatedLink extends DataObject implements PermissionProvider {

    private static $db = array(
        'Phrase'     	  => 'VARCHAR(255)',
        'TitleTag'   	  => 'VARCHAR(255)',
        'AnchorTag' 	  => 'VARCHAR(255)',
        'NewWindow'  	  => 'Boolean',
        'NoFollow'   	  => 'Boolean',
        'SelfLinking'     => 'Boolean',
        'CaseSensitive'   => 'Boolean',
        'MaxLinksPerPage' => 'INT',
        'Priority'		  => 'Int'
    );

    private static $defaults = array(
        'MaxLinksPerPage' => 10
    );

    private static $default_sort = 'Priority';

    private static $has_one = array(
        'Page' => 'SiteTree'
    );

    private static $summary_fields    = array( 'Phrase', 'PointsTo' );
    private static $searchable_fields = array( 'Phrase' );
    private static $singular_name	  = 'Automated Link';
    private static $plural_name	      = 'Automated Links';
    private static $parsableFields    = array();

    /**
     * Get the url of the page linked to this object
     *
     * @return string
     */
    public function PointsTo(){
        return $this->Page()->Link();
    }

    /**
     * Return the phrase set for this object
     *
     * @return string
     */
    public function Title(){
        return $this->Phrase;
    }

    /**
     * Return the rendered version of this object
     *
     * @return String
     */
    public function forTemplate(){
        return $this->getHTML();
    }

    public function canView( $member = false ){
        return Permission::check('AUTOMATEDLINK_VIEW');
    }

    public function canEdit( $member = false ){
        return Permission::check('AUTOMATEDLINK_EDIT');
    }

    public function canDelete( $member = false ){
        return Permission::check('AUTOMATEDLINK_DELETE');
    }

    public function canCreate( $member = false ){
        return Permission::check('AUTOMATEDLINK_CREATE');
    }

    public function providePermissions() {
       return array(
         'AUTOMATEDLINK_VIEW'   => 'View Automated Links',
         'AUTOMATEDLINK_EDIT'   => 'Edit Automated Links',
         'AUTOMATEDLINK_DELETE' => 'Delete Automated Links',
         'AUTOMATEDLINK_CREATE' => 'Create Automated Links',
       );
     }

	public function requireDefaultRecords(){
		parent::requireDefaultRecords();

		// Update all links to redirector pages during dev/build
		foreach( self::get() as $link ) {
		    $link->CheckAndUpdateDestination( true );
		}
	}

	/**
	 * Returns the HTML Representation of this object
	 *
     * @param  String $originalPhrase
	 * @return String
	 */
	public function getHTML($originalPhrase = NULL) {
		$link     = ($this->PageID) ? $this->Page()->Link() : '#';
		$title    = ($this->TitleTag) ? "title='{$this->TitleTag}'" : '';
		$nofollow = ($this->NoFollow) ? 'rel="nofollow"' : '';
		$newtab   = ($this->NewWindow) ? 'target="_blank"' : '';
        $anchor = ($originalPhrase) ? $originalPhrase : $this->Phrase;
		$link     = ($this->AnchorTag) ? rtrim($link, '#').'#'.$this->AnchorTag : $link;
		return "<a href=\"$link\" $title $nofollow $newtab data-id=\"{$this->ID}\">{$anchor}</a>";
	}

	public function getCMSFields() {
		$fields = FieldList::create(TabSet::create('Root'));

		$fields->addFieldsToTab('Root.LinkSettings', array(
			TextField::create('Phrase', 'Phrase to search for', $this->Phrase, 255),
			TextField::create('TitleTag', 'Title Tag', $this->TitleTag, 255),
			TextField::create('AnchorTag', 'Anchor Tag(#)', $this->AnchorTag, 255),
			FieldGroup::create(
				CheckboxField::create('NoFollow'),
				CheckboxField::create('NewWindow'),
				CheckboxField::create('SelfLinking', 'Allow page to link to itself'),
				CheckboxField::create('CaseSensitive', 'Match the case of the phrase')
			),
			NumericField::create('MaxLinksPerPage', 'Maximum amount of this link to be created on a single page( 0 = unlimited )'),
			TreeDropdownField::create('PageID', 'Page to link to', 'SiteTree')
		));

		$settings = GlobalAutoLinkSettings::get_current();
		if ($settings) {
			$fields->addFieldsToTab('Root.Global', array(
				NumericField::create(
					'Global_MaxLinksPerPage',
					'Maximum amount of links a single page can have ( 0 = unlimited )',
					$settings->MaxLinksPerPage
				),
				TextField::create(
					'Global_ExcludeTags',
					'Do not include links into these HTML Tags ( comma seperated )',
					$settings->ExcludeTags
				),
				TextField::create(
				    'Global_AddTo',
				    'Page types where links should be created in ( leave blank for all page types )',
				    $settings->AddTo ),
				TextField::create(
					'Global_IncludeIn',
					'Include Links into these fields ( comma seperated & field must support html injection )',
					$settings->IncludeIn
				)
			));
		}

		return $fields;
	}

    public function getCMSValidator() {
        return new RequiredFields(array('Phrase', 'PageID'));
    }

	/**
	 * Save the Global Settings into the
	 * Global Auto Link Settings Object
	 *
	 * @return void
	 */
	public function onBeforeWrite() {
		parent::onBeforeWrite();

		$settings = GlobalAutoLinkSettings::get_current();
		if ($settings) {

			foreach ($this->getChangedFields() as $field => $value) {
				if (strpos($field, 'Global_') === 0 && isset($value['after'])) {
					$field = str_replace('Global_', '', $field);
					$settings->$field = $value['after'];
				}
			}

			$settings->write();
		}

		$this->CheckAndUpdateDestination();
	}

	/**
	 * Checks if the destination is a redirector page if so
	 * it updates it to the destination of the redirector page
	 *
	 * @Boolean $write - Write the changes if any
	 * @return void
	 */
	public function CheckAndUpdateDestination( $write = false ){
		$this->extend('beforeCheckAndUpdateDestination', $write);

		if( $this->PageID && $this->Page() &&
			$this->Page()->ClassName == 'RedirectorPage' &&
			$this->Page()->LinkToID && $this->Page()->RedirectionType == 'Internal' )
		{
			$this->PageID = $this->Page()->LinkToID;
			if( $write ) {
			    $this->write();
			}
		}
	}

    /**
     * Checks if the field is parable
     *
     * @param SiteTree $page
     * @param String   $field
     * @return Boolean
     */
    public static function isFieldParsable(SiteTree $page, $field) {
        if (!isset(self::$parsableFields[$page->ID]) || !isset(self::$parsableFields[$page->ID][$field])) {
            $fields = self::getAllDatabaseFields($page->ClassName);
            self::$parsableFields[$page->ID][$field] =
                (Boolean) array_key_exists($field, $fields) && strtolower($fields[$field]) === 'htmltext' && $page->$field;
        }

        return self::$parsableFields[$page->ID][$field];
    }

    /**
     * Checks if this link can be added to the provided
     * page and field
     *
     * @param ContentController $controller
     * @return Boolean
     */
    public function canBeAdded( ContentController $controller ){
        return ( $this->SelfLinking || $controller->ID != $this->PageID );
    }

    /**
     * Turn the string passed into a DOMDocument object
     *
     * @param string $html
     * @return DOMDocument
     */
    public static function constructDOMDocument($html){
        if( class_exists( 'HTML5_Parser' ) ){
            $html5 = HTML5_Parser::parse( $html );
            if($html5 instanceof DOMNodeList){
                $dom = new DOMDocument();
                while($html5->length > 0) {
                    $dom->appendChild($html5->item(0));
                }
            }else{
                $dom = $html5;
            }
        } else{
            $dom = new DOMDocument();
            $dom->loadHTML( $html );
        }

        return $dom;
    }

    /**
     * Returns an array with all the database fields $class has
     *
     * @param string $class
     * @return array
     */
    public static function getAllDatabaseFields($class){
        $fields = array();
        foreach (ClassInfo::ancestry($class, true) as $ancestor){
            $fields = array_merge($fields, (array) DataObject::database_fields($ancestor));
        }
        return $fields;
    }
}
