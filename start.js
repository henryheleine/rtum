var http_server, db, ws_connection;
var domain = (process && process.argv && process.argv[2] != null) ? process.argv[2] : 'http://localhost:8080/rtum/index.html';
var pwd = '/Users/henry/Documents/nodejs/rtum';
var lib = '/Users/henry/Documents/nodejs/lib';
var Step = require(lib+'/step.js');

Step(
  function init() {
    setupHttpServerThenDisplayPageAndCreateWebSocket(this.parallel());
    setupDbAndConnect(this.parallel());
  }
);


function setupHttpServerThenDisplayPageAndCreateWebSocket() {
  http_server = require('http').createServer(function(req, res) {
    res.writeHead(200, {'Content-type':'text/html'});
    var html = "<html>" +
               "<head><title>RTUM</title></head>" +
               "<body>" +
               "<p id=\"received-message\"> Some stuff </p>" +
               "<script type=\"text/javascript\">" +
               "function displayMessage (evt) {" +
               "document.getElementById(\"received-message\").innerHTML = evt.data;" +
               "}" +
               "if (window.addEventListener) {" +
               "window.addEventListener(\"message\", displayMessage, false);" +
               "}" +
               "else{" +
               "window.attachEvent(\"onmessage\", displayMessage);" +
               "}" +
               "</script>" +
               "<iframe id=\"my-iframe\" src="+ domain +" height=\"600px\" width=\"800px\"></iframe>" +
               "</body>" +
               "</html>";
    res.end(html);
  }).listen(8888);
  console.log('\nListening on localhost:8888.');
  console.log('\nDisplaying domain: \'' + domain + '\'.');
  connectWebSocket();
}

function setupDbAndConnect() {
  var fs = require('fs');
  if (!fs.existsSync(pwd+'/data')) {
    fs.mkdirSync(pwd+'/data', 0755);
  }
  if (!fs.existsSync(pwd+'/data/db')) {
    fs.mkdir(pwd+'/data/db', 0755, function(err) {
      console.log('\nConfigured db directory structure.');
      startDbServer();
    });
  }
  else {
    startDbServer();
  }
}

function startDbServer() {
  var startDbServerCmd = '/Applications/mongodb-2.2.0/bin/mongod --dbpath '+pwd+'/data/db &';
  var options = {timeout:500};
  require('child_process').exec(startDbServerCmd, options, function (err, stdout, stderr) {
    if (err) throw err;
    if (stderr) throw stderr;
    console.log('\nDb server started.');
    connectToDb();
  });
}

function connectToDb() {
  db = require("mongojs").connect('127.0.0.1:27017/test');
  db.collection('things').find({}, function(err, result) {
    if (err) throw err;
    console.log('\nRetrieved db result set:');
    console.log(result);
  });
}

function shutdownDbServer() {
  console.log('\nShutting down db server.');
  db.executeDbAdminCommand( { shutdown:1, force:true } );
  console.log('\nDb server successfully shutdown.');
}

function connectWebSocket() {
  var WebSocketServer = require('websocket').server;
  var ws_server = new WebSocketServer({ httpServer:http_server, autoAcceptConnections:false });
  
  ws_server.on('request', function(request) {
    if (request.origin != 'http://localhost:8080') {
      request.reject(); 
    }

    ws_connection = request.accept('echo-protocol', request.origin);
    console.log('\nWebSocket connection setup on ws://localhost:8888 with echo-protocol');
    ws_connection.on('message', function(message) {
      // TODO: Log messages into mongoDB :P
      
      if (message.type === 'utf8') {
        console.log('\nReceived Message: ' + message.utf8Data);
      }
      else if (message.type === 'binary') {
        console.log('\nReceived Binary Message of ' + message.binaryData.length + ' bytes');
      }
    });
  });
}

function unconnectWebSocket() {
  ws_connection.close()
  console.log('\n WebSocket connection closed.');
}
