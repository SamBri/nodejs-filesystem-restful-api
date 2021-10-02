
/*
Server related tasks
*/
// dependencies
var http = require('http');
var https = require('https');
var url = require('url'); //require url from node package manager
var stringDecoder = require('string_decoder').StringDecoder;
var config = require('./config.js');
var fs = require('fs');
//var _data = require('./data'); //custom created library or package
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');
var util =  require('util');
var debug = util.debuglog('server');

//Instantiate the server module object
var server = {};


//TESTING
// @TODO delete this
//CRUD operations

//:C
/*_data.create('test','newFile',{'foo':'bar'}, function(err){
  debug('this was the error', err);

});*/


//:R
/*_data.read('test', 'newFile', function(err,data){
  debug('this was the error', err, 'and this was the data', data);
});*/

//:U
/*_data.update('test','newFile',{'fizz':'logic'},function(err){
  debug('this was the error', err);
});*/

//:D
/*_data.delete('test','newFile',function(err){
  debug('this was the error', err);
});*/

// instantiate the HT TP server
server.httpServer = http.createServer(function(req,res){
  server.unifiedServer(req,res);
});



server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')), //read keys synchronously
  'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem')) //read keys synchronously
};

// instantiate the HTTPS server
server.httpsServer = https.createServer(server.httpsServerOptions, function(req,res){

  server.unifiedServer(req,res);
});



// all the server logic for both http and https createServer
server.unifiedServer = function(req, res){

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

    debug(buffer);    //print values in buffer
    // Choose the handler this request should go to.
    var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // Construct data object to send to handlers
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
        'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    chosenHandler(data, function(statusCode, payload,contentType){

      //Determine the type of response (fallbacck to JSON)
      contentType = typeof(contentType) == 'string' ? contentType : 'json'

       // use the status code called back by the handlers
       statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

       // use the payload called back by the handler, or default to
       payload = typeof(payload) == 'object'? payload : {};

       // return the response parts that are content specific
       var payloadString = "";
       if(contentType == 'json')
      {
         res.setHeader('Content-Type', 'application/json');
         payload = typeof(payload) == 'object' ? payload : {};
         payloadString  = JSON.stringify(payload);
    }
    
      if(contentType == 'html')
      {
       res.setHeader('Content-Type','text/html' );
       payloadString = typeof(payload) == 'string' ? payload : '';
    }


       // return the response-parts that are common to all content-types
           res.writeHead(statusCode);
           res.end(payloadString);

        if(statusCode == 200){
          debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+'/'+trimmedPath+' '+statusCode);
        } else{
          debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+'/'+trimmedPath+' '+statusCode);

        }
      //  debug("Returning  this response:",statusCode, buffer);

    });

});
};


// define a request router
server.router = {
  '':handlers.index,
  'account/create':handlers.accountCreate,
  'account/edit': handlers.accountEdit,
  'account/delete':handlers.accountDeleted,
  'session/create':handlers.sessionCreate,
  'session/deleted':handlers.sessionDeleted,
  'checks/all': handlers.checkList,
  'checks/create':handlers.checksCreate,
  'checks/edit': handlers.checksEdit,
  'ping': handlers.ping,
  'api/users': handlers.users,
  'api/tokens':handlers.tokens,
   'api/checks': handlers.checks
};

// Init script
server.init = function(){
  // Start the HTTPs server
  // start the HTTPs server
  server.httpsServer.listen(config.httpsPort,function(){
    console.log('\x1b[36m%s\x1b[0m', "The server is listening on port "+  config.httpsPort + " in " + config.envName + " now" );
  //  debug( +);
  });


  //Start the HTTP server
  server.httpServer.listen(config.httpPort,function(){
    console.log('\x1b[35m%s\x1b[0m', "The server is listening on port "+  config.httpPort + " in " + config.envName + " now" );

  //  debug("The server is listening on port " + config.httpPort + " in " + config.envName + " now");
  });

}

//Export the module
module.exports = server;
