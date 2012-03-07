/*
* jQuery djax
*
* @version v0.12
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
* Maintainer:
*   Brian Zeligson github @beezee
*
*/
(function ($, exports) {
	'use strict';

	$.fn.djax = function (selector, exceptions) {

		// If browser doesn't support pushState, abort now
		if (!history.pushState) {
			return $(this);
		}

		var self = this,
		    blockSelector = selector,
		    excludes = (exceptions && exceptions.length) ? exceptions : [],
			djaxing = false;

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
		self.attachClick = function (el, e) {

			var link = $(el),
				exception = false;

			$.each(excludes, function (k, x) {
				if (link.attr('href').indexOf(x) !== -1) {
					exception = true;
				}
				if (window.location.href.indexOf(x) !== -1) {
					exception = true;
				}
			});

			// If the link is one of the exceptions, return early so that
			// the link can be clicked and a full page load as normal
			if (exception) {
				return $(el);
			}

			// From this point on, we handle the behaviour
			e.preventDefault();

			// If we're already doing djaxing, return now and silently fail
			if (self.djaxing) {
				return $(el);
			}

			$(window).trigger('djaxClick');
			self.reqUrl = link.attr('href');
			self.triggered = false;
			self.navigate(link.attr('href'), true);
		};

		// Handle the navigation
		self.navigate = function (url, add) {

			var blocks = $(blockSelector);

			self.djaxing = true;

			// Get the new page
			$.get(url, function (response) {
				if (url !== self.reqUrl) {
					self.navigate(self.reqUrl);
					return true;
				}

				var result = $('"' + response + '"'),
				    newBlocks = $(result).find(blockSelector);

				if (add) {
					window.history.pushState(
						{
							'url': url,
							'title' : $(result).filter('title').text()
						},
						$(result).filter('title').text(),
						url
					);
				}

				// Set page title as new page title
				$('title').text($(result).filter('title').text());

				// Loop through each block and find new page equivalent
				blocks.each(function () {

					var id = '"#' + $(this).attr('id') + '"',
					    newBlock = newBlocks.filter(id),
					    block = $(this);

					if (newBlock.length) {
						if (block.html() !== newBlock.html()) {
							block.replaceWith(newBlock);
						}
					} else {
						block.remove();
					}

				});

				// Loop through new page blocks and add in as needed
				$.each(newBlocks, function () {

					var newBlock = $(this),
					    id = '#' + $(this).attr('id'),
					    before,
					    beforeID,
					    parentID,
						lastBlock;

					if (!$(id).length) {

						before = $(result).find(id).prev();

						if (before.length) {
							beforeID = '#' + before.attr('id');
							newBlock.insertAfter(beforeID);
						} else {
							parentID = '#' + newBlock.parent().attr('id');
							newBlock.prependTo(parentID);
						}
					}

					lastBlock = blocks.filter(id);

				});

				// Only add a class to internal links
				$('a').filter(function () {
					return this.hostname === location.hostname;
				}).addClass('dJAX_internal').on('click', function (e) {
					return self.attachClick(this, e);
				});

				// Trigger djaxLoad event as a pseudo ready()
				if (!self.triggered) {
					$(window).trigger(
						'djaxLoad',
						[{
							'url': url,
							'title' : $(result).filter('title').text(),
							'response' : response
						}]
					);
					self.triggered = true;
					self.djaxing = false;
				}
			});
		}; /* End self.navigate */

		// Only add a class to internal links
		$(this).find('a').filter(function () {
			return this.hostname === location.hostname;
		}).addClass('dJAX_internal');


		$('a.dJAX_internal').on('click', function (e) {
			return self.attachClick(this, e);
		});

		// On new page load
		$(window).bind('popstate', function (event) {
			self.triggered = false;
			self.djaxing = false;
			if (event.originalEvent.state) {
				self.reqUrl = event.originalEvent.state.url;
				self.navigate(event.originalEvent.state.url);
			}
		});

	};

}(jQuery, window));