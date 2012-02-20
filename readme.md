#djax: Dynamic pjax

##Basic usage

djax is very quick to set up, with a few markup requirements to let it work smoothly.

First include it in your header after jquery:

    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
    <script type="text/javascript" src="jquery.djax.js"></script>
    
Then instantiate on the largest page element where you will have updating content. 'body' is typically the way to go with this:

    <script type="text/javascript">
        jQuery(document).ready(function($) {
            $('body').djax('.updatable', ['array', 'of', 'url', 'fragments', 'to', 'exclude']);
        });
    </script>
    
Congrats, you're done! Well mostly...

##Markup

djax will track elements with the class you pass it as a first argument. In the above example I've passed the class 'updatable,' so my markup would look something like this:

    <body>
        <div class="wrapper" id="main">
            <div class="updatable first" id="first">
                Here's a div that will be monitored for changes by djax.
            </div>
            <div class="updatable second" id="second">
                Here's another
            </div>
        </div>
        <div class="sidebar" id="sidebar-right">
            <ul class="updatable sidebar-list">
                <li>Everything in this sidebar...</li>
                <li>is also being tracked</li>
                <li>Some pages might not have this ul</li>
                <li>That's fine, it just won't show on them</li>
            </ul>
        </div>
        
Your markup can be laid out however you like, and your trackable sections can be anywhere in relation to one another. It's best to keep them top level (nesting is unnecessary and unsupported,) and
there are a few requirements that allow the plugin to function properly.

###IDs

Trackable elements must all have IDs. This is how the requested page is matched up with the current page. Only trackable elements that differ between the two pages will be loaded.
Trackable elements that do not exist on the requested page will be removed, and trackable elements that do not exist on the current page will be added. In order to support this, it
is also necessary to ensure the *parent* elements of every trackable element has an ID, as well as the sibling element immediately *prior* to each trackable element (if one exists).

These ID's are used to add elements when necessary. If an element exists in a requested page, but not the current page, it will be inserted after the prior sibling (by ID,) or prepended to
the parent element (by ID.)

##Parameters

The plugin accepts only two parameters, and only one is required.

###Tracking Class

The first and only required parameter is the class you will use to identify trackable elements. If my code looks like the below sample, every dynamic element in my markup should have a class
of djaxable

    <script type="text/javascript">
        jQuery(document).ready(function($) {
            $('body').djax('.djaxable');
        });
    </script>
    
###Exceptions

By default djax works on any internal links, but sometimes you may want to exclude certain URLs on your site. The second parameter allows you to pass an array of URL fragments to exclude from djax
loading. This is performed with a simple Javascript 'indexOf,' so the more of the URL you provide, the more specifically your exclusions will be matched. The below example will djax any internal links
that do not contain admin, resources, or ?s= in the url.

    <script type="text/javascript">
        jQuery(document).ready(function($) {
            $('body').djax('.djaxable', ['admin', 'resources', '?s=']);
        });
    </script>
    
##Events

By loading new content via ajax, your visitors will only encounter $('document').ready() the first time they land on your site, and any time they manually perform a hard refresh. To help address this,
djax triggers a window level event on each partial load it performs. Here's an example of enabling pageview tracking with Google Analytics on a djax enabled site:

$(window).bind('djaxLoad', function(e, data) {
    _gaq.push(['_trackPageview']);
});

As a convenience, the data object passed with the event contains the requested url, and page title for the requested page.

##Live Demo

djax arose out of a desire to use [pjax](https://github.com/defunkt/jquery-pjax) with complicated and varied layouts. See [here](http://brianzeligson.com/djax) for a WordPress site using a modified version
of the [bones](http://themble.com/bones/) WordPress theme. djax enabling this theme took about [28 lines of code](https://github.com/beezee/bones-responsive/commit/58aadde224d74f8aaa3266a4bd76e961f2888ada)
(if you count adding a class to an element as a line of code.)

There is also a small working example in the github repository. Feel free to load up any of the included html files in your browser to see how it works.