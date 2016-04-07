
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var sockjs = require('sockjs');
var connections = [];

var chat = sockjs.createServer();

chat.on('connection', function(conn) {
  connections.push(conn);
  var number = connections.length;
  broadcast('User ' + number + ' has joined.');

  conn.on('data', function(message){
    broadcast(message);
  });

  conn.on('close', function(){
    broadcast("User " + number + " has left.");
  });

});

function broadcast(message){
  var DELIMITER = ':::::'
  if(message.indexOf(DELIMITER)!=-1){
    var details = message.split(DELIMITER);
    message = details[0]+' says: '+ details[1];
  }
  for(var user=0; user<connections.length; user++) {
    connections[user].write(message);
  }
}
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

chat.installHandlers(server, {prefix:'/chat'});
