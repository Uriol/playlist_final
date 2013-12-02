
$(document).ready(function(){


	// Click on add songs Icon
	$('#addSongs').on('click', function(){
		
		$('#top').removeClass('active').addClass('inActive');

		$('#searchPage').removeClass('inActive').addClass('active');
	});

	// Submit search
	// soundcloud key
	var SCclient = 'd27fb54867b8d24eff5ec23aec6a0c7e';
	var search;
	// Init Sound Cloud API
	SC.initialize({ client_id: SCclient });

	$( "#searchInput" ).keyup(function(e) {

		if(e.keyCode == 13) {

			// Apply styles
			$('#opacityLayer').removeClass('inActive').addClass('active');
			$('#searchResults').removeClass('inActive').addClass('active');
			$('#resultsList').removeClass('inActive').addClass('active');

	  		search = $('#searchInput').val();

	  		SC.get('/tracks', { q: search, limit: 15 }, function(tracks) {

	  			if (tracks.length == 0) {
	                alert('Sorry, no songs');
	          	}

	          	// Display songs in a list style
	          for (var i = 0; i < tracks.length; i++) {
	                track = tracks[i];
	                

                if (track.artwork_url == null){
                	track.artwork_url = '../images/soundcloud_null.png';
                }

                if (track.title.length >= 50) {
                	//alert('large text');
                }

                if (track.streamable == true) { // Display just songs that can be streamed

                	$('#resultsList ').append('<div class="song"><img src=' + track.artwork_url + ' class="cover" height="55" width="55"><h1>' + track.title + '</h1></div');
	           	}
	        }

	  		});

	  	}
	});
	
	closeSearch();
	// Close search
	function closeSearch(){

		$('#closeSearch').on('click', function(){

			$('.song').remove();
			$('#resultsList').removeClass('active').addClass('inActive');
			$('#searchResults').removeClass('active').addClass('inActive');
			$('#opacityLayer').removeClass('active').addClass('inActive');
			$('#searchPage').removeClass('active').addClass('inActive');
			$('#top').removeClass('inActive').addClass('active');
		})
	}


});