/*
* jQuery djax
*
* @version v0.122
*
* Copyright 2012, Brian Zeligson
* Released under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
*
* Homepage:
*   http://beezee.github.com/djax.html
*
* Authors:
*   Brian Zeligson
*
* Contributors:
*  Gary Jones @GaryJones
*
* Maintainer:
*   Brian Zeligson github @beezee
*
*/

/*jslint browser: true, indent: 4, maxerr: 50, sub: true */
/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, immed:true, latedef:true, noarg:true, noempty:true, nomen:true, nonew:true, onevar:true, plusplus:true, regexp:true, smarttabs:true, strict:true, trailing:true, undef:true, white:true, browser:true, jquery:true, indent:4, maxerr:50, */
/*global jQuery */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name jquery.djax.js
// @externs_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/jquery-1.7.js
// ==/ClosureCompiler==
// http://closure-compiler.appspot.com/home

(function ($, exports) {
	'use strict';

    $.support.cors = true;

    var url_queue = [];
    var djaxing = false;
    var reqUrl;
    var triggered;
    
    var _methods = {
        'clearDjaxing' : function () {
            var $this = this;
            djaxing = false;

            // check in the queue to see if there is something else that
            // needs to be navigated
            if (url_queue.length) {
                var url_addToHist = url_queue.pop();
                url_queue = [];


                var url = url_addToHist[0],
                    addToHistory = url_addToHist[1];
                methods.navigate.call($this, url, addToHistory);
            }
        },
        'navigate' : function (url, add_to_history) {
            var $this = this;

            var blockSelector = $this.data('djaxBlockSelector');
			var blocks = $(blockSelector);

			djaxing = true;

			// Get the new page
			$(window).trigger(
				'djaxLoading', [{
					'url' : url
				}]
			);

            var settings = $this.data('settings');
            
			$.ajax({
				'url' : url,
                'data' : settings.ajax_data_parameter,
                'crossDomain' : true,
				'success' : function (responseData, textStatus, jqXHR) {
                    // use the url shown indicated in the response if possible
                    var target_url = jqXHR.getResponseHeader("TargetUrl");
                    if (typeof target_url === 'undefined') {
                        target_url = url;
                    }
                    else {
                        // trust the header
                        reqUrl = target_url;
                    }
					_methods.replaceBlocks.call($this, target_url, add_to_history, blocks, responseData);
				},
				'error' : function (jqXHR, textStatus, errorThrown) {
                    if (errorThrown === "" && textStatus === "error") {
                        // just "browse" to the url provided to handle redirects
                        window.location.href = this.url;
                    }
                    else {
                        // handle error
                        // still replace blocks as we may end up here if the
                        // correct content type is not set by the webserver -
                        // (e.g., with content type set to application/json an
                        // error may be returned)
                        _methods.replaceBlocks.call($this, url, add_to_history, blocks, jqXHR['responseText']);
                    }
				}
			});
		},
        'attachClick' : function (element, event) {
            var $this = this;

			var link = $(element),
				exception = false,
                excludes = $this.data('djaxUserExcludes');

			$.each(excludes, function (index, exclusion) {
				if (link.attr('href').indexOf(exclusion) !== -1) {
					exception = true;
				}
				if (window.location.href.indexOf(exclusion) !== -1) {
					exception = true;
				}
			});

			// If the link is one of the exceptions, return early so that
			// the link can be clicked and a full page load as normal
			if (exception) {
				return $(element);
			}

			// From this point on, we handle the behaviour
			event.preventDefault();

			// If we're already doing djaxing, return now and silently fail
			if (djaxing) {
				setTimeout(function() { _methods.clearDjaxing.call($this); }, 1000);
				return $(element);
			}

			$(window).trigger('djaxClick', [element]);
			reqUrl = link.attr('href');
			triggered = false;
			_methods.navigate.call($this, link.attr('href'), true);
		},
        'replaceBlocks' : function (url, add, currentBlocks, response) {
            var $this = this;

            if (url !== reqUrl) {
                _methods.navigate.call($this, reqUrl, false);
                return true;
            }

            // get some settings
            var blockSelector = $this.data('djaxBlockSelector');
            var replaceBlockWithFunc = $this.data('djaxReplaceBlockWith');

            var $result = $(response);

            // add them to the history if requested
            if (add) {
                window.history.pushState(
                    {
                        'url' : url,
                        'title' : $result.filter('title').text()
                    },
                    $result.filter('title').text(),
                    url
                );
            }

            // Set page title as new page title
            //
            // Set title cross-browser:
            // - $('title').text(title_text); returns an error on IE7
            //
            document.title = $result.filter('title').text();

            // parse new blocks
            var $newBlocks = $(response).find(blockSelector);

            // Loop through each block and find new page equivalent
            currentBlocks.each(function () {

                var $currentBlock = $(this);
                var id = '#' + $currentBlock.attr('id');
                var newBlock = $newBlocks.filter(id);
                
                // take all internal links in the new block
                $('a', newBlock).filter(function () {
                    return this.hostname === location.hostname;
                })
                    // add the dJAX_internal class to them
                    .addClass('dJAX_internal')
                    
                    // attach the click event
                    .on('click.djax', function (event) {
                        _methods.attachClick.call($this, this, event);
                    });
                
                if (newBlock.length) {
                    // compare the html of the new and the current block
                    var block_html = $currentBlock.clone().wrap('<div>').parent().html(),
                        newblock_html = newBlock.clone().wrap('<div>').parent().html();

                    if (block_html !== newblock_html) {
                        // perform replacement
                        var detatched = replaceBlockWithFunc.call($currentBlock, newBlock);

                        // get rid of detatched DOM elements
                        $(detatched).remove();
                    }
                    else {
                        // get rid of the new block if the html of the old
                        // block is exactly the same!
                        $(newBlock).remove();
                    }
                } 
            });


            // Loop through new page blocks and add in as needed
            var $previousBlock;

            $.each($newBlocks, function () {

                var $newBlock = $(this),
                    id = '#' + $(this).attr('id'),
                    $previousSibling;

                // If there is a new page block without an equivalent block
                // in the old page, we need to find out where to insert it
                if (!$(id).length) {

                    // Find the previous sibling
                    $previousSibling = $result.find(id).prev();

                    if ($previousSibling.length) {
                        // Insert after the previous element
                        $newBlock.insertAfter('#' + $previousSibling.attr('id'));
                    } else {
                        // There's no previous sibling, so prepend to parent instead
                        var parent_id = $newBlock.parent().attr('id');
                        if (parent_id === undefined && $previousBlock !== undefined) {
                            $newBlock.insertAfter('#' + $previousBlock.attr('id'));
                        }
                        else {
                            $newBlock.prependTo('#' + parent_id);
                        }
                    }
                }

                // Keep the previous block
                $previousBlock = $newBlock;

                // Only add a class to internal links
                $('a', $newBlock).filter(function () {
                    return this.hostname === location.hostname;
                }).addClass('dJAX_internal').on('click.djax', function (event) {
                    return _methods.attachClick.call($this, this, event);
                });

            });



            // Trigger djaxLoad event as a pseudo ready()
            if (!triggered) {
                $(window).trigger(
                    'djaxLoad',
                    [{
                        'url' : url,
                        'title' : $result.filter('title').text(),
                        'response' : response
                    }]
                );
                triggered = true;
                djaxing = false;
            }

            // Trigger a djaxLoaded event when done
            $(window).trigger(
                'djaxLoaded',
                [{
                    'url' : url,
                    'title' : $result.filter('title').text(),
                    'response' : response
                }]
            );
        }
    };

    var methods = {
        'init' : function (options) {

            var settings = $.extend({
                'selector' : undefined,
                'exceptions' : [],
                'replaceBlockFunction' : undefined,
            }, options);
            
            return this.each(function() {
                var $this = $(this);

                // save settings
                $this.data('settings', settings);

                // If browser doesn't support pushState, abort now
                if (!history.pushState) {
                    return $(this);
                }

                var excludes = settings.exceptions,
                    replaceBlockWith = (settings.replaceBlockFunction) ? settings.replaceBlockFunction: $.fn.replaceWith;

                djaxing = false;

                var blockSelector = settings.selector;

                // Save block selector internally so that we can use it in later calls
                $this.data('djaxBlockSelector', blockSelector);
                
                // Save the replaceBlockWith function internally too...
                $this.data('djaxReplaceBlockWith', replaceBlockWith);

                // Save excludes so that we can use them later...
                $this.data('djaxUserExcludes', excludes);
            
                // Ensure that the history is correct when going from 2nd page to 1st
                window.history.replaceState(
                    {
                        'url' : window.location.href,
                        'title' : $('title').text()
                    },
                    $('title').text(),
                    window.location.href
                );
                
                // Exclude the link exceptions
                // Only add a class to internal links
                $this.find('a').filter(function () {
                    return this.hostname === location.hostname;
                }).addClass('dJAX_internal').on('click.djax', function (event) {
                    return _methods.attachClick.call($this, this, event);
                });

                // On new page load
                $(window).bind('popstate', function (event) {
                    triggered = false;
                    if (event.originalEvent.state) {
                        reqUrl = event.originalEvent.state.url;
                        _methods.navigate.call($this, event.originalEvent.state.url, false);
                    }
                });
            });
        },
        'is_djaxing' : function () {
            return djaxing;
        },
        'navigate' : function (url, add_to_history, data) {
            var $this = this;

            if (typeof data === 'undefined') {
                data = [];
            }
            
            if (djaxing) {
               // push url in the queue and handle once the previous ajax
               // request has completed
               url_queue.push([url, add_to_history]); 

               // handle queue
			   setTimeout(function () { _methods.clearDjaxing.call($this)} , 1000);
               return $this;
            }
            else {
                triggered = false;
                $(window).trigger('djaxClick', data);
                reqUrl = url;
                _methods.navigate.call($this, url, add_to_history);
            }
        }
    };
    
    $.fn.djax = function(method) {
        /*
         * Just a router for method calls
         */
        if (methods[method]) {
            // call a method
            return methods[method].apply(this,
                Array.prototype.slice.call(arguments, 1)
            );
        }
        else if (typeof method == 'object' || !method) {
            // call init, user passed the settings as parameters
            return methods.init.apply(this, arguments);
        }
        else {
            $.error('Cannot call method ' + method);
        }

    };

}(jQuery, window));
