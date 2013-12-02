
// Click on create a new session button
$('#createButton').on('click', function(){

	sessionName = $('#sessionName').val();
	console.log(sessionName);
	
	
	userData.sessionName = sessionName;
	userData.session_ID = userData.geohash + '_' + userData.sessionName;
	

	if (sessionName != ''){ // if user entered name
		socket.emit('creating new session', userData);
		
	} else {
		alert('In order to create a new session, enter a name for it first.');
	}
})

// Recieve success on creating a new session
socket.on('success creating new session', function(){
	
	$('#partyName h1').text(userData.sessionName);
	$('#create_joinPage').removeClass('active').addClass('inActive');
	$('#wrapper').removeClass('scroll').addClass('noScroll');
	$('#noSongs').removeClass('inActive').addClass('active');
	$('#sessionPage').removeClass('inActive').addClass('active');
})


// Recieve error creating new session
socket.on('failed creating session', function(){
	alert('Failed to create this session. Try renaming it.');
})


// Join session
$('.session').live('click', 'body', function(){

	userData.session_ID = $(this).data('session_id');
	userData.sessionName = $(this).text();
	console.log(userData.sessionName);
	console.log(userData.session_ID)
	// Send join to the server
	socket.emit('joinning session', userData);

});

// Recieve success
socket.on('success joinning session', function(){
	
	$('#partyName h1').text(userData.sessionName);
	$('#create_joinPage').removeClass('active').addClass('inActive');
	$('#wrapper').removeClass('scroll').addClass('noScroll');
	$('#noSongs').removeClass('inActive').addClass('active');
	$('#sessionPage').removeClass('inActive').addClass('active');

	refresh();
})