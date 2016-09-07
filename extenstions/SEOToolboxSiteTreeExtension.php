<?php

class SEOToolboxSiteTreeExtension extends DataExtension{

    private static $db = array(
        'MetaTitle' => 'VARCHAR(255)'
    );

    public function MetaTags($tags){
        $tags = preg_replace('/<title(.*?)<\/title>/im','', $tags);
        $title = ( $this->owner->MetaTitle ) ? $this->owner->MetaTitle : $this->owner->Title;
        $tags .= "<title>{$title}</title>";
        return $tags;
    }

    // #TODO: Combine Desktop and mobile into a single tab so that the keyword box only needs to be filled in once
    public function updateCMSFields(FieldList $fields){
        $fields->addFieldsToTab('Root.SEO', array(
            TextField::create("MetaTitle",
                _t('SEOToolbox.SEOMetaTitle', 'Meta title')
            )->setRightTitle(
                _t('SEOToolbox.SEOMetaTitleHelp',
                    'Name of the page, search engines use this as title of search results. 
                    If unset, the page title will be used.')
            ),
            TextareaField::create("MetaDescription", $this->owner->fieldLabel('MetaDescription'))
                ->setRightTitle(
                    _t('SEOToolbox.METADESCHELP',
                        "Search engines use this content for displaying search results 
                        (although it will not influence their ranking).")
                )->addExtraClass('help'),
            TextareaField::create("ExtraMeta",$this->owner->fieldLabel('ExtraMeta'))
                ->setRightTitle(
                    _t('SEOToolbox.METAEXTRAHELP',
                        "HTML tags for additional meta information. For example &lt;meta name=\"customName\" 
                        content=\"your custom content here\" /&gt;")
                )->addExtraClass('help'),
            SEOToolboxAnalyzerField::create('Analyzer', $this->owner->URLSegment ),
        ));
    }

}
