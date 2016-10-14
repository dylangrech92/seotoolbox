SEOTEST (Crawler)
=================

## User-Guide

The crawler is custom built for SilverStripe sites. It starts off by picking a
set of pages from your database and starts crawling them, after each crawl tests are performed.

New urls which are not listed in the database like paginated pages are picked up from each
page that is crawled.


#### Tests Performed
|Test|Description|
|---|---|
|**BLOCKED PAGES**|Lists all pages that are blocked by robots and how they are blocked|
|**SITEMAP**|Lists all issues found related to the sitemap|
|**BAD LINKS**|Lists links found that point to error pages example: 404s or 500s|
|**H1 INFO**|Lists details about h1s on each page|
|**H2 INFO**|Lists details about h2s on each page|
|**WORD COUNT**|Lists the total word count and article word count of each page|
|**INTERNAL LINKS**|Lists issues & information about internal links on each page|
|**EXTERNAL LINKS**|Lists issues & information about external links on each page|
|**IMAGES**|Lists issues & information about images on each page|
|**META TITLE**|Lists issues & information about meta title on each page|
|**META DESCRIPTION**|Lists issues & information about meta description on each page|
|**CANONICAL**|Lists all pages that have problems with canonical tags|
|**NO-INDEX PAGES**|Lists all pages that have a no-index flag|
|**URL STRUCTURE**|Lists all issues related to the format of your urls|
|**DUPLICATE META TAGS**|Lists all duplicate meta tags issues|
|**LANG TAGS**|Lists information about your language tags|
|**ORPHAN PAGES**|List all pages that are orphan on your site. (Sitemap is taken into consideration)|
|**REDIRECT LINKS**|Lists all pages that have links which point to redirects|
|**SOCIAL**|Lists all issues related to missing OG, Twitter or Google tags|

#### Colours
When running the tests you will notice that the headers of the tests start changing colour and this
is because the header colour reflects the most important message in that list.

![Crawler Color Legen](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_crawler_legend.png)

#### Exporting the results
Sometimes you need to export your results into an editing tool such as Excel to better organize
your data. This can be easily done by hitting the **export** button just next to the down arrow
in the headers of the tests.

**NOTE** This feature is only available in _Google Chrome_


## Developer Guide

### Configs

#### Alternate Domain
If you're running your admin under a different domain then your front-end. It's best to setup
the alternate domain so that the crawler can make calls directly to the front-end domain for
pages and resources.

**Note: The front-end domain is the alternate domain. As the main domain for the crawler is the 
admin domain**
```php
Config::inst()->update('SEOTestSiteTreeController', 'alternate_domain', '<front-end-domain>');
```

#### User-Agents
If you would like to change the default desktop / mobile user-agent simply update them through their
config like so:
```yaml
SEOTestSiteTreeController:
  desktop_user_agent: '<desktop agent>'
  mobile_user_agent:  '<mobile agent>'
```

#### Ignore URLs
Sometimes you might want to skip some urls from being crawled. To do so simply specify a set
of regex rules like so:
```yaml
SEOTestSiteTreeController:
  ignore_paths:
    - '$dev\/' # This will ignore anything that starts with dev/
    - '[?|&]stage=Stage' # This will ignore any staging urls
    - 'myCustomVar=1^' # This will ignore any url that ends with "myCustomVar=1"
```

### Tests

#### Adding custom tests
Sometime the need for custom test might arise due to business logic. This can be easily achieved by
registering your custom test with the crawler api like so:

**PHP**
```php
// This class must be an extension for: SEOTestSiteTreeController
class MyExtension extends DataExtension{

    public function onAfterInit(){
        Requirements::combine_files( 'mytests.js', array( <file paths> );    
    }

}
```

**JS**
```JS
var name    = 'internal_name', // must be unique
    title   = 'Title of the test shown to the user',
    headers = ['col1', 'col2', 'col3']; // Column headers for your test result

// The function is called everytime a page is crawled    
crawler.regiser_test(name, title,[headers], function(){});
```

#### Test Callback
When registering a test the callback is called with a bunch of useful properties to perform your test.
```JS
/**
    * Specify your test as a function that takes these arguments
    * 
    * @param {string} url       - The url of the page fetched
    * @param {jQuery} html      - jQuery object of the html of the page fetched
    * @param {string} headers   - String with response headers for the page fetched
    * @param {Array} field_data - Regex result array for all the html fields of the page fetched
    * @param {Array} phrases    - Array of text values found in the html of the fetched page
    */
function callback(url, html, headers, field_data, phrases){}
```

___

### Events

#### Trigger on event
Sometimes you need to trigger an action based on the event that just happened during the crawl.
This can be easily done like so:
```JS
crawler.event_handler.on('<event>', function(<params>){});
```
|Event|Triggered|Params
|---|---|---|
|**TOGGLED**|When a result set is toggled|test_name|
|**BEFORE_EXPORT**|Before the export command starts|test_name|
|**AFTER_EXPORT**|After the export command finishes|test_name|
|**CRAWL_FOUND_REDIRECT**|When a redirect is encountered|source_url, redirect_url|
|**CRAWL_FINISHED**|After a crawl of a page has finished and page tests have been run|page_tested_url|
|**ALL_CRAWLS_FINISHED**|When all pages have been crawled|N/A|
|**CRAWL_BEFORE_TESTS**|Before executing the tests|page_tested_url|
|**before\<TestName>**|Before TestName is executed|url, html, headers, field_data, phrases|
|**after\<TestName>**|Before TestName is executed|url, html, headers, field_data, phrases|
|**CRAWL_AFTER_TESTS**|When all tests for this page have finished executing|page_tested_url|
|**CRAWL_LOAD_FAILED**|When we fetch a page that returns an error|page_tested_url|
|**CRAWLER_LOOP**|Triggered every second from when the crawler starts|crawler|
|**BEFORE_INIT**|Before anything starts happening|crawler|
|**AFTER_INIT**|Crawler is ready to start but hasn't started crawling yet|crawler|

#### Creating a custom event
Creating your own custom events is also very easily simply create a trigger like so:
```JS
/**
* @param {string} event - The event that hooks can hook to
* @param {Array} params - An array of params to pass to the callback function
*/
crawler.event_handler.trigger(event, params);
```
___

### Painter

#### Changing the type of the test result
```JS
/**
* @param {string} test_name - The test name you specified when registering the test
* @param {string} type      - Result type ('default', 'info', 'warning', 'error', 'success')
*/
crawler.painter.set_type(test_name, type);
```

#### Adding a row to the test results
```JS
/**
* Note that adding a row that has a status box will trigger a check that sets the type of the
* test according to the worste status box present in the result set.
* 
* @param {string} test_name    - The test name you specified when registering the test
* @param {Array} values        - An array of values to show to the users under the headers provided in the test
*/
crawler.painter.add_row(test_name, values);
```

#### Creating a status box with icon
```JS
/**
* @param {string} type     - The type of status box to create ('default', 'info', 'warning', 'error', 'success')
* @param {string} string   - The string to show in the status box
*/
crawler.painter.create_status(type, string);
```

--- 

### Helper Functions
```JS
crawler.get_test_by_name(<string> name);
crawler.que_url(<string> url);
crawler.sanitize(<string> url);
crawler.get_domain(<string> url);
crawler.set_ignore_paths(<Array> paths);
crawler.can_crawl(<string> url);
crawler.is_file(<string> url);
crawler.is_external(<string> url);
crawler.is_anchor(<string> href, <string> url);
crawler.is_html(<string> html);
crawler.strip_img_src(<string> html);
crawler.get_proxy(<string> url);
crawler.get_word_count(<string|Array> data);
crawler.set_property(<string> property, <string|int> key, <mixed> val);
```

