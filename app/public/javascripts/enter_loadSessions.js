// socket.io
var socket = io.connect('http://localhost:5000');


var userData = {};
var geohash_string;

var usernameEntered = false;

var songsPlaying = false;

// Click on enter button
$('#log_in').on('click', function(){

	var username = $('#usernameInput').val();

	if (username != '') { // if username is not empty
		usernameEntered = true;

		// Store username valu
		userData.username = username;
		load_join_create_sessionPage();

	} else {
		alert('Enter your name first.')
	}

})

// Prepare join / create session page
function load_join_create_sessionPage(){

	$('#home').removeClass('active').addClass('inActive');
	$('#loading').removeClass('inActive').addClass('active');

	// Get user coords
	getUserCoords();
}



// Check for geolocation support
if (navigator.geolocation){
	console.log('Geolocation is supported');
} else {
	alert('Geolocation is not supported');
}

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

	$('#noSessionsAround').removeClass('inActive').addClass('active');

	openCreate_joinPage();
})

// Recieve there are session around
socket.on('These are the sessions around', function(result){
	
	

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
	$('#create_joinPage').removeClass('inActive').addClass('active');

}

