

var audio_On = false;
var refreshSong = false;


var song_to_play = {};
// Recieve songs to play
socket.on('play this song', function(result){
	
	if (songsPlaying == true){
		songPlaying.destruct();
		restartProgressBar();
	}

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

	play();
})

// Setup SoundManager
soundManager.setup({
    preferFlash: false
    // debugMode: false
});

var songPlaying;

function play(){
	
	console.log(song_to_play);
	songPlaying = soundManager.createSound({

		id : song_to_play.id,
		url : song_to_play.url,
		autoLoad: true,

		onload : function(){
			console.log('song loaded');
			songsPlaying = true;
			songPlaying.play();
			if (audio_On == false){
				songPlaying.mute();
			}
			
		},

		onplay: function() {
			console.log('start playing');
			refreshProgressBar();
			
		},

		onfinish: function(){
			console.log('song finished playing');
			restartProgressBar();
			songPlaying.destruct();
			
			songsPlaying = false;
			activateNoSongs();
		} 
		
	});
}

audio_on_off();
function audio_on_off(){

	$('#audio').on('click', function(){

		if (songsPlaying == true){

			if (audio_On == false){
				$('#audio').css('background-image', 'url(../images/audio3.png)');
				audio_On = true;
				songPlaying.unmute();
			} else {
				$('#audio').css('background-image', 'url(../images/audioOFF.png)');
				audio_On = false;
				songPlaying.mute();
			}
		}
	})
}


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
	refresh();
})

// Recieve success refreshing 
socket.on('succes refreshing', function(firstSong, song_date, date){

		if (songsPlaying == true){
			songPlaying.destruct();
			restartProgressBar();
		}

		songsPlaying == true;

		console.log(firstSong);
		
		var elapsedTime = date - song_date;
		
		console.log(elapsedTime);
		
		// refresh progress bar
		var time = 1000;
		var difference = (100/firstSong.song_duration)*time;
		var progress = difference + elapsedTime;
		console.log(progress);
		console.log(difference);
		
		var progressBarInterval_onRefresh = setInterval(function(){

			progress += difference;
			console.log(progress);
			$('#progress').css('width', progress + '%');

		}, time);

		
		$('#noSongs').removeClass('active').addClass('inActive');
		$('#songs').removeClass('inActive').addClass('active');


		// Prepare Page
		$('#songText h1').text(firstSong.song_name)
		$('#songText h2').text('By ' + firstSong.song_username);
		$('#cover').css('background-image', 'url(' + firstSong.song_cover + ')');
		$('#soundwave').css('background-image', 'url(' + firstSong.song_waveform + ')');
	
})



// var date = new Date().getTime();
// console.log(date);

// setTimeout(function(){
// 	var date2 = new Date().getTime();
// 	console.log(date2);
// },2000);



