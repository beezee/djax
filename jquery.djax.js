(function($, exports) {
    
    $.fn.djax = function(selector, exceptions) {
        
        var self = this;
        
        window.history.replaceState({'url': window.location.href, 'title' : $('title').text()}, $('title').text(), window.location.href);
        
        var blockSelector = selector;
        
        self.navigate = function(url, add) {
            var blocks = $(blockSelector);
             $.get(url, function(response) {
              var result = $('"'+response+'"');
              if (add) window.history.pushState({'url': url, 'title' : $(result).filter('title').text()}, $(result).filter('title').text(), url);
              else window.history.replaceState({'url': url, 'title' : $(result).filter('title').text()}, $(result).filter('title').text(), url);
              $('title').text($(result).filter('title').text());
                  var newBlocks = [];
                  var newBlocks = $(result).find(blockSelector);
                  console.log(newBlocks);
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
                     console.log(id);
                     if (!$(id).length) {
                          var before = $(result).find(id).prev();
                          console.log(before);
                          if (before.length) { var beforeID = '#'+ before.attr('id'); newBlock.insertAfter(beforeID); }
                          else { var parentID = '#' + newBlock.parent().attr('id'); newBlock.prependTo(parentID); console.log(parentID);}
                     }
                      lastBlock = blocks.filter(id);
                  });
                  $('a').filter(function() { return this.hostname == location.hostname; }).addClass('dJAX_internal');
             });
          }
    
        $(this).find('a').filter(function() { return this.hostname == location.hostname; }).addClass('dJAX_internal');
        
        
        $('a.dJAX_internal').live('click', function(e) {
            var link = $(this);
           var exception = false;
           console.log(exceptions);
           $.each(exceptions, function(k, x) {
            console.log(link.attr('href').indexOf(x));
            console.log(x);
             if (link.attr('href').indexOf(x) != -1) exception = true;
             if (window.location.href.indexOf(x) != -1) exception = true;
           });
           if (exception) return;
           e.preventDefault();
           self.navigate(link.attr('href'), true);
        });
        
        $(window).bind('popstate', function(event){
            var popped = false;
            console.log(event);
            console.log(window.history.state);
            //console.log(event.originalEvent.state.url);
            // Ignore inital popstate that some browsers fire on page load
            //if( event.originalEvent.state.url) window.location.href = event.originalEvent.state.url;
            self.navigate(event.originalEvent.state.url);
        });
        
    }
    
})(jQuery, window);