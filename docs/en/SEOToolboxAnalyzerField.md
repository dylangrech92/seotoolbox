SEOToolboxAnalyzerField
=======================

This field was created to check a page for major SEO issues directly in the EditForm of that page.

## Usage
```php
public function getCMSFields(){
    $fields = parent::getCMSFields();
    $fields->addFieldToTab(
        'Root.SEO',
        SEOToolboxAnalyzerField::create('Analyzer', $this->URLSegment )
    );
    return $fields;
}
```
