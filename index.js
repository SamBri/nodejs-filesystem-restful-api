/*
Primary file for the API
*/

// Dependencies
var server = require('./lib/server.js');
var workers = require('./lib/workers.js');
var cli = require('./lib/cli');

// Declare the app.
var app = {

};

// Init function
app.init = function(){
// Start the server
server.init();

// Start the workers
workers.init();

// start the cli but make sure it starts cli
setTimeout(function(){
  cli.init();
}, 50);


};

// Execute the funciton
app.init();


// Export the app
module.exports = app;
