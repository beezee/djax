(function($, exports) {
    
    $.fn.djax = function(selector) {
        
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
                  var newBlocks = result.filter(function() {
                    return ($(this).attr('id')); 
                  });
                  blocks.each(function() {
                      var id = '"#'+$(this).attr('id')+'"';
                      var newBlock = newBlocks.filter(id);
                      var block = $(this);
                      if (newBlock.length) {
                          if (block.html() != newBlock.html()) block.html(newBlock.html());
                      } else block.remove();
                  });
                  var lastBlock = newBlocks[0];
                  $.each(newBlocks, function() {
                     var id = '"#'+$(this).attr('id');
                     var newBlock = blocks.filter(id);
                     if (!newBlock.length) {
                          if ($(this) == lastBlock) $(this).insertBefore(blocks[0]);
                          else $(this).insertAfter(lastBlock);
                     }
                      lastBlock = blocks.filter(id);
                  });
                  $('a').filter(function() { return this.hostname == location.hostname; }).addClass('dJAX_internal');
             });
          }
    
        $(this).find('a').filter(function() { return this.hostname == location.hostname; }).addClass('dJAX_internal');
        
        
        $('a.dJAX_internal').live('click', function(e) {
           e.preventDefault();
           var link = $(this);
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