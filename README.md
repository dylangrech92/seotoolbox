# SEO Toolbox

This plugin was created to facilitate SEO work. It add functionality in 3
different areas:<br />
1) In the CMS by adding extra functionality to the Site Tree object<br />
2) In the Controller to alter the final html output during rendering<br />
3) As a standalone testing tool to perform various checks on the site

---

### Installation
```
composer require dylangrech92/seotoolbox
framework/sake dev/build
```

### Dependencies
- [SortableGridField](https://github.com/UndefinedOffset/SortableGridField)
- [Silverstripe-html5](https://github.com/silverstripe/silverstripe-html5) (Optional but recommended)


### Compatability
[Silverstripe 3.0+](https://www.silverstripe.org/download/)

---

## Features

### Automated Links
Manually adding and updating thousands of links every time you do a small url
change or wanting to target a new keyword is just insanity.


This tool allows you to simply specify a keyword you want to target and where
it should point to amongst a few other options. Once that is saved, the tool will
automatically link the keyword specified to the page specified.

##### Settings
![Creating a new Automated Link](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_add_link.png)

##### Global Settings
![Automated Links Global Settings](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_global_settings.png)

___

### Crawler
There are various types of crawlers out there. Personally I use
[Screaming Frog](https://www.screamingfrog.co.uk/seo-spider/), however the problem
with such tools is that they can be a bit expensive and can't really know if
you have orphan pages or not.

This is why I've created this crawler that starts off with a list of all pages
in your database and then crawls the site to find any other pages that might not be listed
in your db, like: _paginated pages_.

Unlike Screaming Frog it doesn't just show the data but also performs small tests
to validate the data therefore reducing the need for a professional SEO to look
over the data.


##### How to run the crawler
You can either hit the **Run Crawler** button in your admin or go to:
<yoursite.com>/seotest *(You must be logged in to run the crawler)*

##### Options
There is only 1 option when running the test: Should the crawl be performed
with a desktop or mobile [user-agent](https://en.wikipedia.org/wiki/User_agent).

![Crawler Settings](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_crawler_options.png)

##### Configurations

```yaml
    SEOTestSiteTreeController:
      desktop_user_agent: 'agent' # Specify a different user agent for crawling desktop version
      mobile_user_agent: 'agent' # Specify a different user agent for crawling mobile version
      sprite_path: 'path/to/your/sprite' # Specify your own sprite for icons in the crawler
      css: # Specify your own css styling for the crawler
        - path/to/file/1
        - path/to/file/2
      ignore_path: # Specify regex for urls you want to ignore in the crawler
        - ^(test|notest) # Ignore all urls that starts with 'test' or 'notest'
```

##### Disclaimer
Since some site owners prefer to run their admin in a different domain then
their front-end and because curl is much more reliable then $.ajax, the crawler
may take upwards of 1 hour to complete on bigger sites because each url must be first
sent to your back-end, parsed and then sent back to JS for final parsing and rendering.

##### Crawler Tests
![Crawler Settings](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_crawl_1.png)
![Crawler Settings](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_crawl_2.png)


---

### On Page Settings & Reports
Apart from the crawler this plugin also adds a small report to you page edit form.
This idea was taken from [Live SEO for Silverstripe](https://github.com/micschk/silverstripe-liveseo).
However turned it into a much smaller but greatly more reliable report. Instead of just
1 report for the whole page, this report is split into 2 tabs: Desktop & Mobile and
in here only the most important data is shown + a google preview snippet and a keyword
analysis tool.

![On Page Analysis](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_onpage_analysis.png)

---

### Automated Link Report
This is just a report that you will find in the reports section of your admin
that explains how each automated link is affecting your pages.


##### Configurations
```yaml
    # Once this config is activated the report will stop running in realtime and start
    # looking for the AutomatedLinkPageResult object.
    #
    # To populate this object add this to your crontab:
    # framework/sake AutomatedLinkReportTask
    
    AutomatedLinkReport:
      run_in_realtime: false 
```

 ---
 
 ### License
 This plugin is licensed under:
 [GNU GENERAL PUBLIC LICENSE Version 3 (GPL V3)](https://github.com/dylangrech92/seotoolbox/blob/master/license/license.txt)
 
 ---
 
 ### Contributing
 Have ideas? Pitch them first before starting any work as I might have started working on your idea already :)
 
 ---
 
 ### Planned Features
 - Options to add custom filters to crawler
 - Structured data automatic markup and validation tester
 - OpenGraph and Twitter tags
 - Performance analyzer
 - Improve performance of automatic link generation




