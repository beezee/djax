jQuery('document').ready(function($) {
    var transition = function($newEl) {
		var $oldEl = this;      // reference to the DOM element that is about to be replaced

		// ** Simple fadeout/fadein **
		// $newEl.hide();          // hide the new content before it comes in
		// $oldEl.fadeOut("slow", function() {
		//     $oldEl.replaceWith($newEl);
		//     $newEl.show();
		//     $newEl.fadeIn("fast");
		// });
		
		// ** Fadeout then slide in **
		$oldEl.fadeOut('fast', function () {
			$oldEl.after($newEl);

			$newEl.hide();
			$newEl.slideDown('slow');
			$newEl.fadeIn('slow');

			$oldEl.remove();	// removes 'oldEl'
		});


    }

   $('body').djax({
       'selector' : '.one-third', 
       'exceptions' : [], 
       'replaceBlockFunction' : transition
   });

   $(window).bind('djaxLoad', function(e, params) {
    console.log($('<div>'+params.response+'</div>'));
   })
});
