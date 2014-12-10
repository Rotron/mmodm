/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var http = require('http');
var express = require('express');
var passport = require('passport');
var routes = require('./routes');
var controller = require('./controller');
var path = require('path');
var config = require('./config');
var twitter = require('ntwitter');
var fs = require('fs');

mongoose.connect(config.db);

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var twit = new twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.ac_key,
    access_token_secret: config.ac_secret
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.cookieParser());
app.use(express.session({ secret: config.session_secret }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//Routes
app.get('/', routes.index);

app.get('/tweet/:msg', routes.tweet)

app.get('/auth/twitter',
passport.authenticate('twitter'),
routes.auth);

app.get('/auth/twitter/callback',
passport.authenticate('twitter', { failureRedirect: '/login' }),
routes.auth_cb);

app.get('/logout', routes.logout);

//Middlewear
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
        res.redirect('/')
}

http.listen(app.get('port'), function(){
  console.log('MM0DM server listening on port ' + app.get('port'));
  fs.writeFile(__dirname + '/start.log', 'started');
});

//Socket.io & Twitter Stream API
var users = []
io.on('connection', function (socket) {
    users.push(socket);
});

var watch = ['#MMODM'];

twit.verifyCredentials(function (err, data) {
    if(err) console.log(err);
})
.stream('user', {track:watch}, function(stream) {
    console.log("Twitter stream is ready and waiting for inc tweets...");
    stream.on('data', function (data) {
        if (data.text !== undefined) {
            var name = data.user.screen_name;

            var tweet_txt = data.text.split("#");
            var keystrokes = tweet_txt[0].split("");
            notes.pop();
            console.log(notes)
            users.forEach(function(i, socket, arr){
                socket.emit('keys', keystrokes);
            })
        }
    });

    stream.on('error', function (err, code) {
        console.log("err: "+err+" "+code)
    });
});
