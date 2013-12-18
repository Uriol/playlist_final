console.log('welcome');


// Setup Mongo
var db = require('mongoskin').db('localhost:27017/soundcloudPlaylist');
var sessions = db.collection('sessions');


var http = require("http"),
        fs = require('fs'),
         path = require('path'),
        url = require('url'),
        io = require('socket.io');


 

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
};

// Initial path
var webroot = "public";

var server = http.createServer(function(req,res) {
        
        // File path
        var fileToLoad = webroot + url.parse(req.url).pathname;

        // If its the www directory open index.html
        if(req.url == "/") {
                fileToLoad = "public/index.html";
        }

        var fileBytes;
        var httpStatusCode = 200;

        // check if the file exist
        fs.exists(fileToLoad,function(doesItExist) {

                // if it doesn't exist load error404.html
                if(!doesItExist) {
                        console.log('does not exists');
                        httpStatusCode = 404;
                        fileToLoad = webroot + "/error404.html";
                }

                // Know what kind of file it is
                fileBytes = fs.readFileSync(fileToLoad);
                var mimeType = mimeTypes[path.extname(fileToLoad).split(".")[1]]; 

                res.writeHead(httpStatusCode,{'Content-type':mimeType});
                res.end(fileBytes);
        });
// }).listen(8080,'127.0.0.1');
})

server.listen(8080,'127.0.0.1');





var socketServer = io.listen(server);

socketServer.sockets.on('connection', function(socket){
    var userSocket_id = socket.id;
    console.log('hello ' + userSocket_id)

    
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

    // Recieve computer joins session
    socket.on('desktop joinning session', function(userData){
        sessionRoom = userData.session_ID;

        socket.join(userData.session_ID);
        socket.join(userData.session_ID);
        socket.emit('success joinning session for desktop');


    })
    
    var song_to_play;
    
    // Recieve add new song ----------------------------------------------------------------
    socket.on('add this song', function(song_info){


        console.log(song_info);
        var songs_queue;


        // Find how many songs are on the queue
        sessions.findOne({session_ID : song_info.session_ID}, function(err, result){
            if (err) throw err;

            if (result == null) {
                console.log('bug fixed!');
                socket.emit('song not added / session removed')
            }  //else {

            else { //

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
                                console.log(result);
                                // if (err) throw err;
                                if (result == null){
                                    console.log('the result was null / bug fixed');
                                }

                                if (result.songs.length <= 0){
                                    console.log('no songs to play');
                                }
                                if (result.songs.length >= 1) {
                                    ('first song ready ');
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
                                    socket.emit('no more songs on queue');
                                    socket.broadcast.to(song_info.session_ID).emit('no more songs on queue');
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
            }

        }); // end of find session
    })

    
    // Refresh session page --------------------------------------
    socket.on('refresh', function(userData) {
        
        // Find the first song on the session
        sessions.findOne({session_ID : userData.session_ID}, function(err, result){
            var date = new Date().getTime();
            if (err) throw err;
            if (result == null) {
                console.log('Bug fixed!');
                socket.emit('session removed');
            }
            else if (result.songs[0] == null) {
                console.log('no songs on queue');
                socket.emit('success refreshing / no songs on queue');
            } else {
                var firstSong = result.songs[0];
                var song_date = result.date;
                console.log(firstSong)
                socket.emit('succes refreshing', firstSong, song_date, date);
            }

        });
    });


    // Handle disconnect
    socket.on('disconnect', function () {

        if (sessionRoom){ // if the user is in a session
            console.log('user from a session left')
            // user leave room
            socket.leave(sessionRoom);
            // Get number of users in the session
            var usersinroom = socketServer.sockets.clients(sessionRoom).length;
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


// detect when a song is finish( when there are no more songs on queue) // clear interval
// in refresh : if no songs load #noSongs
// join a session when a song is playing (refresh) // fix refresh bar on refreshing
// Songs likes and dislikes

// css media queries iphone 4
// desktop version -- server prepared for another index!




