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
    
    var _methods = {
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
			if ($this.djaxing) {
				setTimeout($this.clearDjaxing, 1000);
				return $(element);
			}

			$(window).trigger('djaxClick', [element]);
			$this.reqUrl = link.attr('href');
			$this.triggered = false;
			methods.navigate.call($this, link.attr('href'), true);
		},
        'replaceBlocks' : function (url, add, blocks, response) {
            var $this = this;

            var blockSelector = $this.data('djaxBlockSelector');
            var replaceBlockWithFunc = $this.data('djaxReplaceBlockWith');

            if (url !== $this.reqUrl) {
                methods.navigate.call($this, $this.reqUrl, false);
                return true;
            }

            var result = $(response),
                newBlocks = $(result).find(blockSelector);

            if (add) {
                window.history.pushState(
                    {
                        'url' : url,
                        'title' : $(result).filter('title').text()
                    },
                    $(result).filter('title').text(),
                    url
                );
            }

            // Set page title as new page title
            // Set title cross-browser:
            // - $('title').text(title_text); returns an error on IE7
            //
            document.title = $(result).filter('title').text();

            // Loop through each block and find new page equivalent
            blocks.each(function () {

                var id = '#' + $(this).attr('id'),
                    newBlock = newBlocks.filter(id),
                    block = $(this);
                
                $('a', newBlock).filter(function () {
                    return this.hostname === location.hostname;
                }).addClass('dJAX_internal').on('click.djax', function (event) {
                    _methods.attachClick.call($this, this, event);
                });
                
                if (newBlock.length) {
                    if (block.html() !== newBlock.html()) {
                        replaceBlockWithFunc.call(block, newBlock);
                    }
                } else {
                    block.remove();
                }

            });

            // Loop through new page blocks and add in as needed
            var $previousBlock;

            $.each(newBlocks, function () {

                var newBlock = $(this),
                    id = '#' + $(this).attr('id'),
                    $previousSibling;

                // If there is a new page block without an equivalent block
                // in the old page, we need to find out where to insert it
                if (!$(id).length) {

                    // Find the previous sibling
                    $previousSibling = $(result).find(id).prev();

                    if ($previousSibling.length) {
                        // Insert after the previous element
                        newBlock.insertAfter('#' + $previousSibling.attr('id'));
                    } else {
                        // There's no previous sibling, so prepend to parent instead
                        var parent_id = newBlock.parent().attr('id');
                        if (parent_id === undefined && $previousBlock !== undefined) {
                            newBlock.insertAfter('#' + $previousBlock.attr('id'));
                        }
                        else {
                            newBlock.prependTo('#' + parent_id);
                        }
                    }
                }

                // Keep the previous block
                $previousBlock = newBlock;

                // Only add a class to internal links
                $('a', newBlock).filter(function () {
                    return this.hostname === location.hostname;
                }).addClass('dJAX_internal').on('click.djax', function (event) {
                    return _methods.attachClick.call($this, this, event);
                });

            });



            // Trigger djaxLoad event as a pseudo ready()
            if (!$this.triggered) {
                $(window).trigger(
                    'djaxLoad',
                    [{
                        'url' : url,
                        'title' : $(result).filter('title').text(),
                        'response' : response
                    }]
                );
                $this.triggered = true;
                $this.djaxing = false;
            }

            // Trigger a djaxLoaded event when done
            $(window).trigger(
                'djaxLoaded',
                [{
                    'url' : url,
                    'title' : $(result).filter('title').text(),
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
                'replaceBlockFunction' : undefined
            }, options);
            
            return this.each(function() {
                var $this = $(this);

                // If browser doesn't support pushState, abort now
                if (!history.pushState) {
                    return $(this);
                }

                var excludes = settings.exceptions,
                    replaceBlockWith = (settings.replaceBlockFunction) ? settings.replaceBlockFunction: $.fn.replaceWith,
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
                
                $this.clearDjaxing = function() {
                    $this.djaxing = false;
                }

                // Exclude the link exceptions
                // Only add a class to internal links
                $this.find('a').filter(function () {
                    return this.hostname === location.hostname;
                }).addClass('dJAX_internal').on('click.djax', function (event) {
                    return _methods.attachClick.call($this, this, event);
                });

                // On new page load
                $(window).bind('popstate', function (event) {
                    $this.triggered = false;
                    if (event.originalEvent.state) {
                        $this.reqUrl = event.originalEvent.state.url;
                        methods.navigate.call($this, event.originalEvent.state.url, false);
                    }
                });
            });
        },
        'navigate' : function (url, add_to_history) {
            var $this = this;

            var blockSelector = $this.data('djaxBlockSelector');
			var blocks = $(blockSelector);

			$this.djaxing = true;

			// Get the new page
			$(window).trigger(
				'djaxLoading',
				[{
					'url' : url
				}]
			);
            
			$.ajax({
				'url' : url,
				'success' : function (response) {
					_methods.replaceBlocks.call($this, url, add_to_history, blocks, response);
				},
				'error' : function (response, textStatus, errorThrown) {
					// handle error
					// console.log('error', response, textStatus, errorThrown);

                    // still replace blocks as we may end up here if the
                    // correct content type is not set by the webserver -
                    // (e.g., with content type set to application/json an
                    // error may be returned)
                    _methods.replaceBlocks.call($this, url, add_to_history, blocks, response['responseText']);
				}
			});
		} /* End self.navigate */
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
