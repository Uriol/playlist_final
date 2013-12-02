console.log('welcome');


// Setup Mongo
var db = require('mongoskin').db('localhost:27017/soundcloudPlaylist');
var sessions = db.collection('sessions');


var http = require('http');
var util = require('util');
var fs = require('fs');
var exec = require('child_process').exec;

var connect = require('connect');

var port = process.env.PORT || 5000;
 

var app = connect.createServer(
    connect.static(__dirname + '/public')
).listen(port);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket){
    var userSocket_id = socket.id;
    util.log('hello ' + userSocket_id)

    
    var sessionRoom;

    // Recieve show me sessions around -----------------------------------------------------------------
    socket.on('show me sessions around', function(geohash_string){
        console.log(geohash_string);
        var session, i;
        // Look into db
        sessions.findOne({geohash:geohash_string}, function(err, result) {
            if (err) throw err;

            if (result == null){

                socket.emit('no sessions around');
                console.log('no sessions');
            } else {

                console.log('there are sessions around');
                sessions.find({geohash:geohash_string}).toArray(function(err, result){
                    if (err) throw err;
                   
                    socket.emit('These are the sessions around', result);
                    console.log(result);
                })
            }
        })
    })

    // Recieve create new session ----------------------------------------------------------------------
    socket.on('creating new session', function(userData){
        console.log(userData);
        sessionRoom = userData.session_ID;
        // look into db if already exist a session with this name within this geohash
        sessions.findOne({session_ID : userData.session_ID}, function(err, result) {
            if (err) throw err;

            if (result == null) { // if there is no session with this name then create it
                
                // Get user socket ID
                
                
                

                // insert to db
                sessions.insert({geohash:userData.geohash, sessionName: userData.sessionName, session_ID: userData.session_ID, people: [{name:userData.username, socket_ID: userSocket_id}], songs : []}, function(err, result){
                    if (err) throw err;
                    if (result) {
                        // console.log('Created new session');

                        // Create a socket room for the session and join it
                        sessionRoom = userData.session_ID;
                        socket.join(sessionRoom);
                        console.log(sessionRoom);


                        socket.emit('success creating new session', sessionRoom);
                    }
                });

                

            } else {
                socket.emit('failed creating session'); // Session name already exist
            }
        });
    })

    // Recieve join session ----------------------------------------------------------------
    socket.on('joinning session', function(userData){
        sessionRoom = userData.session_ID;
        console.log(userData.session_ID);

        sessions.update({session_ID : userData.session_ID}, 
                        {'$push':{people: 
                                {name : userData.username,
                                socket_ID: userSocket_id}}},
                                function(err){
            if (err) throw err;
            console.log('user added to session');
            socket.join(userData.session_ID);
            socket.emit('success joinning session');

        })

    })

    
    var song_to_play;
    
    // Recieve add new song ----------------------------------------------------------------
    socket.on('add this song', function(song_info){


        console.log(song_info);
        var songs_queue;


        // Find how many songs are on the queue
        sessions.findOne({session_ID : song_info.session_ID}, function(err, result){
            if (err) throw err;

            songs_queue = result.songs.length;
            console.log(songs_queue);

            // if there is no songs on the db add this one and start playing
            if (songs_queue == 0) {
                // Add song to the db
                sessions.update({session_ID: song_info.session_ID }, 
                    {'$push':{songs: { song_url: song_info.url, 
                                        song_waveform: song_info.waveform,
                                        song_duration: song_info.duration,
                                        song_name: song_info.songName,
                                        song_cover: song_info.cover,
                                        song_username: song_info.username}}}, function(err){

                    if (err) throw err;
                    console.log('first song added!');

                    play();

                    

                    function play(){
                        
                        
                       

                        // Go find the first song on the db
                        sessions.findOne({session_ID : song_info.session_ID}, function(err, result){
                            if (err) throw err;

                            if (result.songs.length >= 1) {
                            
                                song_to_play = result.songs[0];
                                
                                //console.log(song_to_play.song_duration);
                                // Send the song to play to all users
                                socket.emit('play this song', song_to_play);
                                var song_date = new Date().getTime();
                                sessions.update({session_ID: song_info.session_ID },
                                        {'$set':{date : song_date}}, function(err){
                                            if (err) throw err;
                                            console.log('date added!')
                                });



                                socket.broadcast.to(song_info.session_ID).emit('play this song', song_to_play);
                                console.log( song_to_play.song_name + ' start playing');

                                
                                setTimeout(function(){

                                    // Delete song from db and play next
                                    sessions.update({session_ID: song_info.session_ID },
                                        {'$pull':{songs: {song_name: song_to_play.song_name}}}, function(err){
                                            if (err) throw err;
                                            console.log('song removed');
                                            console.log(song_to_play.song_name);
                                            // clearInterval(songPositionInterval);
                                            // songPosition = null;
                                            play();
                                        });

                                }, song_to_play.song_duration + 1000);

                                
                                // var songPosition_increment = 1000;
                                // // Set interval for refreshing session
                                // var songPositionInterval = setInterval(function(){

                                //     songPosition = songPosition + songPosition_increment;
                                //     console.log(songPosition);

                                // }, songPosition_increment);


                            
                            } else {
                                console.log('no more songs on queue');
                                song_to_play = 0;
                            }

                        });


                    }
                });

            } else { // There is a song already playing so just update db
                 // Add song to the db
                sessions.update({session_ID: song_info.session_ID }, 
                    {'$push':{songs: { song_url: song_info.url, 
                                        song_waveform: song_info.waveform,
                                        song_duration: song_info.duration,
                                        song_name: song_info.songName,
                                        song_cover: song_info.cover,
                                        song_username: song_info.username}}}, function(err){

                    if (err) throw err;
                    console.log('another song added!');

                });
            }

        });
    })

    
    // Refresh session page --------------------------------------
    socket.on('refresh', function(userData) {
        
        // Find the first song on the session
        sessions.findOne({session_ID : userData.session_ID}, function(err, result){
            var date = new Date().getTime();
            if (err) throw err;
            var firstSong = result.songs[0];
            var song_date = result.date;
            console.log(firstSong)
            socket.emit('succes refreshing', firstSong, song_date, date);

        });
    });


    // Handle disconnect
    socket.on('disconnect', function () {

        if (sessionRoom){ // if the user is in a session
            console.log('user from a session left')
            // user leave room
            socket.leave(sessionRoom);
            // Get number of users in the session
            var usersinroom = io.sockets.clients(sessionRoom).length;
            console.log(usersinroom);


            // Remove user from d
            sessions.update({session_ID : sessionRoom}, {'$pull':{people: {socket_ID: userSocket_id}}}, function(err){
                if (err) throw err;
                console.log('user removed from session db');
            })

        } else {
            console.log('user left before joinning a session');
        }

        // If there are no users left from this session remove it from the db
        if (usersinroom <= 0){
            console.log('empty room');
            sessions.remove({session_ID : sessionRoom}, function(err, result){
                if (err) throw err;
                console.log('Session removed from db');
            })
        }
    })
    


})

// Disable songs to play on the phone
// join a session when a song is playing (refresh) -- refresh progress bar
// Songs likes and dislikes

// css media queries iphone 4
// desktop version




