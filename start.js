var domain = (process && process.argv && process.argv[2] != null) ? process.argv[2] : 'http://www.example.com';
var pwd = '/Users/<username>/Documents/nodejs/rtum';
var lib = '/Users/<username>/Documents/nodejs/lib';
var Step = require(lib+'/step.js');


Step(
  function init() {
    displayPage(this.parallel());
    configureDb(this.parallel());
  }
);


function displayPage() {
  require('http').createServer(function(req, res) {
    res.writeHead(200, {'Content-type':'text/html'});
    res.end('<html><body style=\"margin:0\"><iframe style=\"border:0\" src=\"' + domain + '\" width=\"1200\" height=\"600\"></iframe></body></html>');
    // is called every request: console.log('\nDisplaying domain \'' + domain + '\'.');
  }).listen(8080);
  console.log('\nListening on localhost:8080.');
  console.log('\nDisplaying domain: \'' + domain + '\'.');
}

function configureDb() {
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
  var db = require("mongojs").connect('127.0.0.1:27017/test');
  db.collection('things').find({}, function(err, result) {
    if (err) throw err;
    console.log('\nRetrieved db result set:');
    console.log(result);
    shutdownDbServer();
  });
}

function shutdownDbServer() {
  console.log('\nShutting down db server.');
  // shutdown db server with
  // db.adminCommand({shutdown : 1, force : true});
  console.log('\nending now...');
  process.exit();
}
