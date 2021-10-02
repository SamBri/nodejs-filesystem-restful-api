/*
Primary file for the API
*/

// Dependencies
var server = require('./lib/server.js');
var workers = require('./lib/workers.js');

// Declare the app.
var app = {

};

// Init function
app.init = function(){
// Start the server
server.init();

// Start the workers
workers.init();


};

// Execute the funciton
app.init();


// Export the app
module.exports = app;
