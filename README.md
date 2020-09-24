DEPRECATED
====
I no longer have time to maintain this project, or to upgrade it for Silverstripe version 4 or higher. If anyone would like to try to fork it and upgrade it, feel free to do so.

SEO Toolbox
=================

[![Build Status](https://travis-ci.org/dylangrech92/seotoolbox.svg?branch=master)](https://travis-ci.org/dylangrech92/seotoolbox)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/dylangrech92/seotoolbox/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/dylangrech92/seotoolbox/?branch=master)

This plugin was created to facilitate SEO work. It adds functionality in 3
different areas:<br />
1) In the CMS by adding extra functionality to the Site Tree object<br />
2) In the Controller to alter the final html output during rendering<br />
3) As a standalone testing tool to perform various checks on the site

## Requirements
- [SilverStripe 3.x](https://www.silverstripe.org/download/)
- [SortableGridField](https://github.com/UndefinedOffset/SortableGridField)
- [Silverstripe-html5](https://github.com/silverstripe/silverstripe-html5) (Optional but recommended)


## Installation
```
composer require dylangrech92/seotoolbox
framework/sake dev/build
```

## Usage

### [Automated Links](https://github.com/dylangrech92/seotoolbox/blob/master/docs/en/AUTOMATED_LINKS.md)
Manually adding and updating thousands of links every time you do a small url
change or wanting to target a new keyword is just insanity.

This tool allows you to simply specify a keyword you want to target and where
it should point to amongst a few other options. Once that is saved, the tool will
automatically link the keyword specified to the page specified.

##### Settings
![Creating a new Automated Link](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_add_link.png)

##### Global Settings
![Automated Links Global Settings](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_global_settings.png)

---

### Automated Links Report
A report called **Automated Links Report** is automatically added to you reports section that will list
all the pages that were affected by the **Automated Links** and how these were affected.

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

### [SEOTEST (Crawler)](https://github.com/dylangrech92/seotoolbox/blob/master/docs/en/SEOTEST.md)
This is a fully fledged crawler build mostly in javascript. It will start off by requesting a list of pages that exist
in your SiteTree_Live table and start crawling them to:
- Test for various seo issues such as h1, meta titles, orphan pages, etc..
- Find more pages such as paginated pages

A full list of tests performed can be found [here](https://github.com/dylangrech92/seotoolbox/blob/master/docs/en/SEOTEST.md)

---

### On Page Settings & Reports
Apart from the crawler this plugin also adds a small report to every page edit form.
This idea was taken from [Live SEO for Silverstripe](https://github.com/micschk/silverstripe-liveseo).
However turned it into a much smaller but greatly more reliable report. Instead of just
1 report for the whole page, this report is split into 2 tabs: Desktop & Mobile and
in here only the most important data is shown + a google preview snippet and a keyword
analysis tool.

This functionality can be re-used in other parts of the CMS by using the
[SEOToolboxAnalyzerField](https://github.com/dylangrech92/seotoolbox/blob/master/docs/en/SEOToolboxAnalyzerField.md)

**Note:** A curl is made to the page that is being tested on every page load in the CMS.

![On Page Analysis](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_onpage_analysis.png)

## Reporting an issue
When you're reporting an issue try to include as much information as you can so that the mantainers of this module can
try to closely replicate the issue.

**Useful Information to send in**
- Full stack trace
- PHP version
- Silverstripe version
- A simplistic overview of your setup example: Apache 2.4, admin and front-end are on seperate domains
- Module name that might be conflicting with this one
 



