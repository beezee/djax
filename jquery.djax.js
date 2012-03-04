(function($, exports) {
    
    $.fn.djax = function(selector, exceptions) {
        if (!history.pushState) return $(this);
        
        var self = this;
                
        window.history.replaceState({'url': window.location.href, 'title' : $('title').text()}, $('title').text(), window.location.href);
        
        var blockSelector = selector;
        
        var excludes = (exceptions && exceptions.length) ? exceptions : [];
        
        self.navigate = function(url, add) {
            var blocks = $(blockSelector);
             $.get(url, function(response) {
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
                  $('a').filter(function() { return this.hostname == location.hostname; }).addClass('dJAX_internal');
                  $(window).trigger('djaxLoad', [{'url': url, 'title' : $(result).filter('title').text()}]);
                  if (url != self.reqUrl) self.navigate(self.reqUrl);
             });
          }
    
        $(this).find('a').filter(function() { return this.hostname == location.hostname; }).addClass('dJAX_internal');
        
        
        $('a.dJAX_internal').live('click', function(e) {
            var link = $(this);
           var exception = false;
           $.each(excludes, function(k, x) {
             if (link.attr('href').indexOf(x) != -1) exception = true;
             if (window.location.href.indexOf(x) != -1) exception = true;
           });
           if (exception) return;
           e.preventDefault();
           self.reqUrl = link.attr('href');
           self.navigate(link.attr('href'), true);
        });
        
        $(window).bind('popstate', function(event){
            self.reqUrl = event.originalEvent.state.url;
            self.navigate(event.originalEvent.state.url);
        });
        
    }
    
})(jQuery, window);