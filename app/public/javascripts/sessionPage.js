



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

	  		SC.get('/tracks', { q: search, limit: 20 }, function(tracks) {

	  			if (tracks.length == 0) {
	                alert('Sorry, no songs');
	          	}

	          	

	          	// Display songs in a list style
	          for (var i = 0; i < tracks.length; i++) {
	                track = tracks[i];
	                console.log(track);

	           //  var cover = track.artwork_url;
	          	// cover = cover.replace('-large', '-t500x500');

                if (track.artwork_url == null){
                	track.artwork_url = '../images/soundcloud_null_cover.png';
                }  else {
                	track.artwork_url = track.artwork_url.replace('-large', '-t500x500');
                }

                if (track.title.length >= 50) {
                	//alert('large text');
                }

                if (track.streamable == true) { // Display just songs that can be streamed

                	$('#resultsList ').append('<div class="song" data-url=' + track.stream_url + ' data-waveform=' + track.waveform_url + ' data-duration=' + track.duration + ' data-cover=' + track.artwork_url + '><img src=' + track.artwork_url + ' class="cover" height="55" width="55"><h1>' + track.title + '</h1></div');
	           	}
	        }



	  		});

	  	}
	});



	// Click song to the server and add to db
	$('#resultsList .song').live('click', function(){
		
		var song_info = {};
		song_info.url = $(this).data('url') + '?client_id=' + SCclient;
		song_info.waveform = $(this).data('waveform');
		song_info.duration = $(this).data('duration');
		song_info.cover = $(this).data('cover');
		song_info.songName = $(this).children('h1').text();
		song_info.username = userData.username;
		song_info.session_ID = userData.session_ID;

		// Send this song to the server
		socket.emit('add this song', song_info);
		closeSearch();

	});
	
	

$('#closeSearch').on('click', function(){

	closeSearch();
})
	
function closeSearch(){

		$('.song').remove();
		$('#resultsList').removeClass('active').addClass('inActive');
		$('#searchResults').removeClass('active').addClass('inActive');
		$('#opacityLayer').removeClass('active').addClass('inActive');
		$('#searchPage').removeClass('active').addClass('inActive');
		$('#top').removeClass('inActive').addClass('active');
	}

