// socket.io
var socket = io.connect('http://localhost:8080');

var song_to_play = {};

// Check for geolocation support
if (navigator.geolocation){
	console.log('Geolocation is supported');
} else {
	alert('Geolocation is not supported');
}

getUserCoords();

var userData = {};

function getUserCoords(){
	var userPosition;
	navigator.geolocation.getCurrentPosition(function(position){
		userPosition = position;
		var latitude = userPosition.coords.latitude;
		var longitude = userPosition.coords.longitude;
		

		// Getting geohash
		geohash_string = geohash.encode(latitude, longitude, 6);
		console.log(geohash_string);

		// Store value to userData
		userData.geohash = geohash_string; 

		// Send position to the server
		socket.emit('show me sessions around', userData.geohash);
	})
}


// Recieve there are no sessions around
socket.on('no sessions around', function(){

	console.log('no sessions around');

	$('#noSessionsAround').removeClass('inActive').addClass('active');

	openCreate_joinPage();
})

// Recieve there are session around
socket.on('These are the sessions around', function(result){
	
	console.log('These are the sessions around');

	var session, i;
	for (i = 0; i < result.length; i++){
		session = result[i];
		console.log(session);

		$('#sessionsOn').append('<div class="session" data-session_id=' + session.session_ID + '><h1>' + session.sessionName + '</h1><div class="filet"></div></div>');
	}

	openCreate_joinPage();
})


// Open create / join session page 
function openCreate_joinPage(){

	$('#loading').removeClass('active').addClass('inActive');
	$('#sessions').removeClass('inActive').addClass('active');

}




// Join session
$('.session').live('click', 'body', function(){

	userData.session_ID = $(this).data('session_id');
	socket.emit('desktop joinning session', userData);

});

// Recieve success on joinning session
socket.on('success joinning session for desktop', function(){
	console.log('success joinning session');
	$('#sessions').removeClass('active').addClass('inActive');
	$('#player').removeClass('inActive').addClass('active');
	$('#noSongs').removeClass('inActive').addClass('active');
})


// Recieve songs -------------------------------------------------------
socket.on('play this song', function(result){

	$('#noSongs').removeClass('active').addClass('inActive');
	$('#songPlaying').removeClass('inActive').addClass('active');

	$('#soundwave').css('background-image', 'url(' + result.song_waveform + ')');
	$('#songText h1').text(result.song_name)
	$('#songText h2').text('By ' + result.song_username);
	$('#cover').css('background-image', 'url(' + result.song_cover + ')');

	song_to_play.url = result.song_url;
	song_to_play.id = result.song_name;
	song_to_play.duration = result.song_duration;

	loadSong();


});


// Setup player ----------------------------------------------------------------


// Setup SoundManager
soundManager.setup({
    preferFlash: false
    // debugMode: false
});

var songPlaying;

function loadSong(){

	songPlaying = soundManager.createSound({

		id : song_to_play.id,
		url : song_to_play.url,
		autoLoad: true,

		onload : function(){
			console.log('song loaded');
			songPlaying.play();
		}

	});
}
