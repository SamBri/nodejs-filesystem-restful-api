/*
* primary file for the API
*/

// dependencies
var http = require('http');
var https = require('https');
var url = require('url'); //require url from node package manager
var stringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config.js');
var fs = require('fs');
var _data = require('./lib/data'); //custom created library or package
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

//TESTING
// @TODO delete this
//CRUD operations

//:C
/*_data.create('test','newFile',{'foo':'bar'}, function(err){
  console.log('this was the error', err);

});*/


//:R
/*_data.read('test', 'newFile', function(err,data){
  console.log('this was the error', err, 'and this was the data', data);
});*/

//:U
/*_data.update('test','newFile',{'fizz':'logic'},function(err){
  console.log('this was the error', err);
});*/

//:D
/*_data.delete('test','newFile',function(err){
  console.log('this was the error', err);
});*/

// instantiate the HT TP server
var httpServer = http.createServer(function(req,res){
  unifiedServer(req,res);
});


//Start the HTTP server
httpServer.listen(config.httpPort,function(){
  console.log("The server is listening on port " + config.httpPort + " in " + config.envName + " now");
});


var httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'), //read keys synchronously
  'cert': fs.readFileSync('./https/cert.pem') //read keys synchronously
};

// instantiate the HTTPS server
var httpsServer = https.createServer(httpsServerOptions, function(req,res){

  unifiedServer(req,res);
});

// start the HTTPs server
httpsServer.listen(config.httpsPort,function(){
  console.log("The server is listening on port " + config.httpsPort + " in " + config.envName + " now");
});


// all the server logic for both http and https createServer
var unifiedServer = function(req, res){

  // Get the URL and parse it
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g,'');


  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  var method = req.method.toLowerCase();

  // Get the headers as an object
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new stringDecoder('utf-8');
  var buffer = '';
  req.on('data',function(data){
    buffer += decoder.write(data);
  });

  req.on('end', function(){
    buffer += decoder.end();

    console.log(buffer);    //print values in buffer
    // Choose the handler this request should go to.
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct data object to send to handlers
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
        'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    chosenHandler(data, function(statusCode, payload){
       // use the status code called back by the handlers
       statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

       // use the payload called back by the handler, or default to
       payload = typeof(payload) == 'object'? payload : {};

       // convert the payload to a string
       var payloadString = JSON.stringify(payload);

       // return the response
       res.setHeader('Content-type', 'application/json');
       res.writeHead(statusCode);

       // Send the response
        res.end(payloadString);

        console.log("Returning  this response:",statusCode, buffer);

    });

});
};


// define a request router
var router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens':handlers.tokens,
   'checks': handlers.checks
};
