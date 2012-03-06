/*
* jQuery djax
*
* @version v0.11
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
(function($, exports) {
    
    $.fn.djax = function(selector, exceptions) {
        if (!history.pushState) return $(this);
        
        var self = this;
                
        window.history.replaceState({'url': window.location.href, 'title' : $('title').text()}, $('title').text(), window.location.href);
        
        var blockSelector = selector;
        
        var excludes = (exceptions && exceptions.length) ? exceptions : [];
        
        self.attachClick = function(el, e) {
           var link = $(el);
           var exception = false;
           $.each(excludes, function(k, x) {
             if (link.attr('href').indexOf(x) != -1) exception = true;
             if (window.location.href.indexOf(x) != -1) exception = true;
           });
           if (exception) return $(el);
           e.preventDefault();
           $(window).trigger('djaxClick');
           self.reqUrl = link.attr('href');
           self.triggered = false;
           self.navigate(link.attr('href'), true);
        };
        
        self.navigate = function(url, add) {
            var blocks = $(blockSelector);
             $.get(url, function(response) {
              if (url != self.reqUrl) { self.navigate(self.reqUrl); return true; }
              var result = $('"'+response+'"');
              if (add) window.history.pushState({'url': url, 'title' : $(result).filter('title').text()}, $(result).filter('title').text(), url);
              $('title').text($(result).filter('title').text());
                  var newBlocks = [];
                  var newBlocks = $(result).find(blockSelector);
                  blocks.each(function() {
                      var id = '"#'+$(this).attr('id')+'"';
                      var newBlock = newBlocks.filter(id);
                      var block = $(this);
                      if (newBlock.length) {
                          if (block.html() != newBlock.html()) block.replaceWith(newBlock);
                      } else block.remove();
                  });
                  $.each(newBlocks, function() {
                     var newBlock = $(this);
                     var id = '#'+$(this).attr('id');
                     if (!$(id).length) {
                          var before = $(result).find(id).prev();
                          if (before.length) { var beforeID = '#'+ before.attr('id'); newBlock.insertAfter(beforeID); }
                          else { var parentID = '#' + newBlock.parent().attr('id'); newBlock.prependTo(parentID); }
                     }
                      lastBlock = blocks.filter(id);
                  });
                  $('a').filter(function() { return this.hostname == location.hostname; }).addClass('dJAX_internal').on('click', function(e) {
                        return self.attachClick(this, e);
                    });
                  if (!self.triggered) $(window).trigger('djaxLoad', [{'url': url, 'title' : $(result).filter('title').text(), 'response' : response}]);
                  self.triggered = true;
             });
          }
    
        $(this).find('a').filter(function() { return this.hostname == location.hostname; }).addClass('dJAX_internal');
        
        
        $('a.dJAX_internal').on('click', function(e) {
            return self.attachClick(this, e);
        });
        
        $(window).bind('popstate', function(event){
            self.triggered = false;
            if (event.originalEvent.state)
            {
                self.reqUrl = event.originalEvent.state.url;
                self.navigate(event.originalEvent.state.url);
            }
        });
        
    }
    
})(jQuery, window);