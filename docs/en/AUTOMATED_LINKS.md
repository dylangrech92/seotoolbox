Automated Links
=============

## User Guide

### Creating an automated link
1) Open /admin/seo-tool-box or click **SEO Tool box** from the main CMS menu
2) Click on **Add Automated Link**

### Settings
![Automated Link Settings](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_add_link_marked.png)

#### #1 Phrase to search for
This is the phrase that the plugin will look for in your rendered html to replace with a link.
Phrases can be of any length and include any alpha-numeric character including some special characters

#### #2 Title tag
This is title tag that is going to be added to the generated link if such is set.
```html <a href="" title="whatever title you typed">phrase</a>```

#### #3 Anchor Tag(#)
If this is specified, your link will become an anchor link which means that whenever a user clicks on this link,
they will be automatically scrolled to your dom element that has the corresponding ID or name parameter.
```html
<html>
    <!--
        In this sample html if we set the anchor tag to "scroll-to-here"
        the user will be automatically scrolled to that div so the top
        pixel of the div becomes the top pixel of the browser window
    -->
    <body>
        <div>some-content-is-here</div>
        <div id="scroll-to-here">...</div>
    </body>
</html>
```

#### #4 Toggable Settings
- **No Follow** Adds a ```html rel="nofollow"``` to the generated link
- **New Window** Adds a ```html target="_blank"``` to the generated link
- **Allow pages to link to itself** If this is enabled, the plugin will not check if the generated link points
to the same page the link is on.
- **Match the case of the phrase** If this is enabled, the plugin will only replace text that matches the phrase
entered in a case-sensitive manner.

#### #5 Maximum amount of links to be created on a single page
If this value is specified, the plugin will stop after creating that amount of links, as an example let's say
we specify this value to be 2, our phrase is **SEOToolbox** and the rendered html of this page is:
```html
<p>
    SEOToolbox is a great plugin.
    SEOToolbox helps me do stuff more efficiently.
    SEOToolbox is making the SEO team in our company redundant.
</p>
```
This will now be transformed to:
```html
<p>
    <a hred="some-link">SEOToolbox</a> is a great plugin.
    <a hred="some-link">SEOToolbox</a> helps me do stuff more efficiently.
    SEOToolbox is making the SEO team in our company redundant.
    
    <!-- 
        Note the third one didn't change because we set a limit to 2 
    -->
</p>
```

#### #6 Page to link to
This setting specifies where the link is going to point to.

**NOTE** If for some reason the target is a redirector page and it points to an internal page, 
this will be automatically updated to the destination of the redirector page.

### Global Settings
![Automated Link Global Settings](https://raw.githubusercontent.com/dylangrech92/seotoolbox/master/images/seotoolbox_global_settings_marked.png)

#### #1 Maximum Amount of link on a single page
Just like point #5 in the settings guide, this is a limit for how many links to be created, the only difference
being that this is not just for a particular link but for all links on that page in general.

#### #2 Do not include links into these HTML tags
This is a list of where links should not be created. Therefore if a phrase is candidate to become a link but exists
in 1 of these tags it wown't be created.

#### #3 Page types where links should be created in
If this setting is specified, automated links will only be created in these page types.

#### #4 Include Links into these fields
Here you need to specify all the HTMLText fields that will support link creation. This means if you have:
- Article Page: Introduction, Content
- Index Page: Introduction, Content, BannerText

If you want the replacement to happen in all fields you will need to specify: **Introduction, Content, BannerText**

### Link priority
To prioritize phrases over others is very easy to do. The priority follows the ordering shown in the admin, therefore
if in the /admin/seo-tool-box GridField "foo" is above "bar", foo will be created before bar.

## Developer Guide

### Extension Hooks

#### beforeParseField
To use this hook you will need to add an extension to a controller and create the beforeParseField function
```yml
ContentController:
 extensions:
   - MyExtension 
```
```php
class MyExtension extends Extension{
    
    /**
     * In here we can perform actions before the here mentioned $field
     * text is parsed and where possible links are created.
     * 
     * $html is DOMDocument object of the field mentioned
     * 
     * @param DOMDocument $html
     * @param             $field
     */
    public function beforeParseField(DOMDocument $html, $field){
        // Do something here
    }
}
```

#### beforeCheckAndUpdateDestination
To use this hook you will need to add an extension to the AutomatedLink Object and create 
the beforeCheckAndUpdateDestination function
```yml
AutomatedLink:
 extensions:
   - MyExtension 
```
```php
class MyExtension extends Extension{
    
    /**
     * This function is called just before an Automated Link is saved
     * the caller of this function will then check the destination of this object
     * and if it's a Redirector page will try to change this object's destination
     * to the Redirector Page's destination to avoid redirects in the final result
     */
    public function beforeCheckAndUpdateDestination($write){
        // Do something here
    }
}
```


