

var audio_On = false;
var refreshSong = false;


var song_to_play = {};
// Recieve songs to play
socket.on('play this song', function(result){
	
	
		
	restartProgressBar();
	refreshSong = false;

	songsPlaying == true;

	song_to_play.url = result.song_url;
	song_to_play.id = result.song_name;
	song_to_play.duration = result.song_duration;

	if (songsPlaying == false){
		$('#noSongs').removeClass('active').addClass('inActive');
		$('#songs').removeClass('inActive').addClass('active');
		
	}

	// Prepare Page
	$('#songText h1').text(result.song_name)
	$('#songText h2').text('By ' + result.song_username);
	$('#cover').css('background-image', 'url(' + result.song_cover + ')');
	$('#soundwave').css('background-image', 'url(' + result.song_waveform + ')');

	refreshProgressBar();
})

// Setup SoundManager
soundManager.setup({
    preferFlash: false
    // debugMode: false
});

var songPlaying;



// restart progress bar
function restartProgressBar(){
	clearInterval(progressBarInterval);
	$('#progress').css('width', '0%');
}

var progressBarInterval;

// Actualize progress bar
function refreshProgressBar(){
	
	var progress = 0;

	console.log(song_to_play.duration);  
	var time = 100;
	var difference = (100/song_to_play.duration)*time;
	
	
	progressBarInterval = setInterval(function(){

		progress = progress+difference;
		
		$('#progress').css('width', progress + '%');

	}, time);


}


// When songs finish playing activate no songs layer
function activateNoSongs(){
	$('#songs').removeClass('active').addClass('inActive');
	$('#noSongs').removeClass('inActive').addClass('active');
}

function refresh(){

	socket.emit('refresh', userData);
	console.log(userData.session_ID)
}


$('#refresh').on('click', function(){
	
	restartProgressBar();
	refresh();
})

var progressBarInterval_onRefresh ;

// Recieve success refreshing 
socket.on('succes refreshing', function(firstSong, song_date, date){

		if (songsPlaying == true){
			
			restartProgressBar();
		}

		songsPlaying == true;

		
		
		var elapsedTime = date - song_date;
			

		var time = 100;
		var difference = (100/firstSong.song_duration)*time;

		var increment = (100/firstSong.song_duration)*elapsedTime;
		
		
		//console.log(difference);
		var progress = 0;
		
		var totalTime = 0;
		
		progressBarInterval_onRefresh = setInterval(function(){

			progress = progress+difference;
			
			totalTime = progress + increment;
			$('#progress').css('width', totalTime + '%');
			
			if (totalTime >= 100){
				
				songFinishedAfterRefresh();
				clearInterval(progressBarInterval_onRefresh);
				
			}
			

		}, time);

		

		refreshSong = true;

		
		$('#noSongs').removeClass('active').addClass('inActive');
		$('#songs').removeClass('inActive').addClass('active');


		// Prepare Page
		$('#songText h1').text(firstSong.song_name)
		$('#songText h2').text('By ' + firstSong.song_username);
		$('#cover').css('background-image', 'url(' + firstSong.song_cover + ')');
		$('#soundwave').css('background-image', 'url(' + firstSong.song_waveform + ')');
	
});

// song finished on refresh
function songFinishedAfterRefresh(){

	songsPlaying = false;
	$('#noSongs').removeClass('inActive').addClass('active');
	$('#songs').removeClass('active').addClass('inActive');

	$('#progress').css('width', '0%');


}

// Success refreshing no more songs on queue
socket.on('success refreshing / no songs on queue', function(){

	noMoreSongs();
})


// Recieve no more songs on queue
socket.on('no more songs on queue', function(){
	
	restartProgressBar();
	console.log('recieved no more songs');
	noMoreSongs();

})

function noMoreSongs(){
	songsPlaying = false;
	// display NoSongs
	$('#noSongs').removeClass('inActive').addClass('active');
	$('#songs').removeClass('active').addClass('inActive');
}

// var date = new Date().getTime();
// console.log(date);

// setTimeout(function(){
// 	var date2 = new Date().getTime();
// 	console.log(date2);
// },2000);



