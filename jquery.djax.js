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
    var popstateUrl = '';
    
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
                    addToHistory = url_addToHist[1],
                    urlData = url_addToHist[2],
                    method = url_addToHist[3],
                    requestParameters = url_addToHist[4];

                methods.navigate.call($this, url, addToHistory, urlData, method, requestParameters);
            }
        },
        'navigate' : function (url, add_to_history, method) {
            var $this = this;

            // decide which method to use for the ajax call (POST/GET allowed)
            if (method !== 'POST') {
                method = 'GET';
            }

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

            var ajax_data = settings.ajax_data_parameter;
            if (typeof ajax_data === 'function') {
                ajax_data = ajax_data();
            }

			$.ajax({
				'url' : url,
                'data' : ajax_data,
                'type' : method, // "GET" or "POST"
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
                    if (textStatus === 'error' 
                        && (jqXHR.status === 404 || 
                            errorThrown === "" || 
                            typeof jqXHR.responseText === 'undefined')) {

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

            // trigger asynchronous click event
            var djaxClickData = [element];
			$(window).trigger('djaxClick', djaxClickData);

            // call blocking callback
            var settings = $this.data('settings');
            settings.onDjaxClickCallback.call($this, djaxClickData, {});

            var urlDataAttribute = settings.urlDataAttribute;
            if (typeof urlDataAttribute !== 'undefined') {
                reqUrl = link.data(urlDataAttribute);
            }

            if (typeof reqUrl === 'undefined') {
                reqUrl = link.attr('href');
            }

			triggered = false;
			_methods.navigate.call($this, link.attr('href'), true, 'GET');
		},
        'replaceBlocks' : function (url, add, currentBlocks, response) {
            var $this = this;

            var settings = $this.data('settings');

            if (url !== reqUrl) {
                _methods.navigate.call($this, reqUrl, false, 'GET');
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

            // here store all replacements to be performed
            // they look like:
            // {
            //     type: 'replace', // or prependTo, insertAfter, remove
            //     new_block: $jquery_element,
            //     target: $jquery_element, // or null if a new block needs to be removed
            // }
            //
            var replacements_config = [];

            // Set page title as new page title
            //
            // Set title cross-browser:
            // - $('title').text(title_text); returns an error on IE7
            //
            document.title = $result.filter('title').text();

            // parse new blocks
            var $newBlocks = $(response).find(blockSelector);

            //
            // Case in which blocks need to be replaced
            //
            currentBlocks.each(function () {

                var $currentBlock = $(this);
                var id = '#' + $currentBlock.attr('id');
                var newBlock = $newBlocks.filter(id);
                
                // take all internal links in the new block
                $('a:not(.' + settings.ignoreClass + ')', newBlock).filter(function () {
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
                        replacements_config.push({
                            'type':  'replace',
                            'new_block' : newBlock,
                            'target' : $currentBlock
                        });
                    }
                    else {
                        // get rid of the new block if the html of the old
                        // block is exactly the same!
                        replacements_config.push({
                            'type': 'remove',
                            'new_block': newBlock,
                            'target' : undefined
                        });
                    }
                } 
            });


            // 
            // Case in which blocks need to be added/appended
            //
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
                        replacements_config.push({
                            'type' : 'insertAfter',
                            'target' : $('#' + $previousSibling.attr('id')),
                            'new_block' : $newBlock
                        });
                    } else {
                        // There's no previous sibling, so prepend to parent instead
                        var parent_id = $newBlock.parent().attr('id');
                        if (parent_id === undefined && $previousBlock !== undefined) {
                            replacements_config.push({
                                'type' : 'insertAfter',
                                'target' : $('#' + $previousBlock.attr('id')),
                                'new_block' : $newBlock
                            });
                        }
                        else {
                            replacements_config.push({
                                'type' : 'prependTo',
                                'target' : $('#' + parent_id),
                                'new_block' : $newBlock
                            });
                        }
                    }
                }

                // Keep the previous block
                $previousBlock = $newBlock;
                
                // Only add a class to internal links
                // TODO: Remove this
                // $('a:not(.' + settings.ignoreClass + ')', $newBlock).filter(function () {
                //     return this.hostname === location.hostname;
                // }).addClass('dJAX_internal').on('click.djax', function (event) {
                //     return _methods.attachClick.call($this, this, event);
                // });

                var replace_fn = function ($newBlock) {
                    $('a:not(.' + settings.ignoreClass + ')', $newBlock).filter(function () {
                        return this.hostname === location.hostname;
                    }).addClass('dJAX_internal').on('click.djax', function (event) {
                        return _methods.attachClick.call($this, this, event);
                    });
                }

                replacements_config.push({
                    'type' : 'function',
                    'target': replace_fn,
                    'args' : [$newBlock]
                });

            });

            // Delegate block replacement

            var done_fn = function () {
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
            }
            
            replacements_config.push({
                'type' : 'function',
                'target': done_fn,
                'args' : []
            });

            $(window).trigger(
                'djaxDeferReplacements',
                [ replacements_config ]
            );
        }
    };

    var methods = {
        'init' : function (options) {

            var settings = $.extend({
                'selector' : undefined,
                'ignoreClass' : '',
                'exceptions' : [],
                'urlDataAttribute' : undefined,
                'replaceBlockFunction' : undefined,
                'ajax_data_parameter' : { },
                /*
                 * Called synchronously before ajax call starts.
                 *
                 * - djaxClickData: element or identifier of element the
                 *   user interacted with;
                 *
                 * - requestParameters: parameters that will be included in the
                 *   ajax call. This is an object.
                 */
                'onDjaxClickCallback' : function (djaxClickData, requestParameters) { return; },
                'onHistoryPopStateCallback' : function () { return; }
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
                    ignoreClass = settings.ignoreClass,
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
                $this.find('a:not(.' + ignoreClass + ')').filter(function () {
                    return this.hostname === location.hostname;
                }).addClass('dJAX_internal').on('click.djax', function (event) {
                    return _methods.attachClick.call($this, this, event);
                });

                // On new page load
                $(window).bind('popstate', function (event) {
                    triggered = false;

                    if (event.originalEvent.state) {
                        var targetUrl = event.originalEvent.state.url;

                        // prevent IE <= 9 to navigate repeatedly to the current url
                        var url_parts = targetUrl.split("#");
                        if (url_parts.length === 2) {
                            if (url_parts[0].indexOf(url_parts[1]) >= 0) { 
                                popstateUrl = '';
                                return;
                            }
                        }

                        if (popstateUrl != targetUrl) {
                            settings.onHistoryPopStateCallback();
                            reqUrl = targetUrl;
                            popstateUrl = targetUrl;
                            _methods.navigate.call($this, popstateUrl, false, 'GET');
                        }
                        else {
                            // second time just reset the popstate url.
                            popstateUrl = '';
                        }
                    }
                });
            });
        },
        'is_djaxing' : function () {
            return djaxing;
        },
        'navigate' : function (url, add_to_history, data, method, requestParameters) {
            var $this = this;

            if (typeof data === 'undefined') {
                data = [];
            }
            
            if (djaxing) {
               // push url in the queue and handle once the previous ajax
               // request has completed
               url_queue.push([url, add_to_history, data, method, requestParameters]); 

               // handle queue
			   setTimeout(function () { _methods.clearDjaxing.call($this)} , 1000);
               return $this;
            }
            else {
                triggered = false;
                $(window).trigger('djaxClick', data);

                // call blocking callback
                var settings = $this.data('settings');
                settings.onDjaxClickCallback.call($this, data, requestParameters);

                reqUrl = url;
                _methods.navigate.call($this, url, add_to_history, method);
            }
        },
        'set_ajax_data_parameter' : function (ajax_parameters_func_or_obj) {
            var $this = this;
            var settings = $this.data('settings');
            
            // if function: will be called when needed; if object: will be
            // passed straight away to the $.ajax call.
            settings.ajax_data_parameter = ajax_parameters_func_or_obj;

            // save parameters
            $this.data('settings', settings);
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
