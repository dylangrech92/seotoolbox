# Change Log

25/09/2016
## [v1.0.1](https://github.com/dylangrech92/seotoolbox/releases/tag/v1.0.1)
[Full Change Log](https://github.com/dylangrech92/seotoolbox/compare/v1.0.0...v1.0.1)

**Compliance Fixes**

Updated docs, file structure, license and composer to be compatible with SilverStripe guidelines

---

03/10/2016
## [1.1.0](https://github.com/dylangrech92/seotoolbox/releases/tag/1.1.0)
[Full Change Log](https://github.com/dylangrech92/seotoolbox/compare/v1.0.1...1.1.0)

[All Issues](https://github.com/dylangrech92/seotoolbox/milestone/2?closed=1)

**BUG FIXES**
- [#20](https://github.com/dylangrech92/seotoolbox/issues/20)
XML Pages are no longer treated as error page but instead simply skipped as we don't use them
in the tests for now.
- [#18](https://github.com/dylangrech92/seotoolbox/issues/18)
Canonicals are now properly read therefore duplicate meta tags feature now works properly as well.

**NEW FEATURES**
- [#12](https://github.com/dylangrech92/seotoolbox/issues/12) 
Sitemap & Robots Tests.
- [#13](https://github.com/dylangrech92/seotoolbox/issues/13) 
Added tests for checking OG tags, Twitter Cards, Google Publisher.
- [#22](https://github.com/dylangrech92/seotoolbox/issues/22)
Added legend to crawler as to make the UI more user-friendly and self explanatory.
- [#17](https://github.com/dylangrech92/seotoolbox/issues/17)
Renamed **Error Pages** section to **BAD Links** and added the source url of the bad links.
- [#30](https://github.com/dylangrech92/seotoolbox/issues/30)
Removed custom sprite in favor of glyphicons.
- [#7](https://github.com/dylangrech92/seotoolbox/issues/7)
Added functional tests. Results available here: [https://travis-ci.org/dylangrech92/seotoolbox](https://travis-ci.org/dylangrech92/seotoolbox)
- [#19](https://github.com/dylangrech92/seotoolbox/issues/19)
Orphan pages no longer lists pages that are also error pages
- [#25](https://github.com/dylangrech92/seotoolbox/issues/25)
Scrutinizer setup and running. Results available here: 
[https://scrutinizer-ci.com/g/dylangrech92/seotoolbox/?branch=master](https://scrutinizer-ci.com/g/dylangrech92/seotoolbox/?branch=master)
