/**
 * The API server. The connection string should be something like
 * postgres://username:password@localhost/database
 * 
 * Check the README.md file for the API documentation.
 *
 * $ node server DB_CONN_STRING [SERVER_PORT]
 */
var express = require('express');
var apiModule = require('./src/api');

// Create app, attach API.
var app = express();
app.use('/api/', apiModule(process.argv[2]));

// Start listening on given port.
var port = 8080;
if (process.argv.len > 3) {
  port = parseInt(process.argv[3]);
}
app.listen(port, function() {
  var server_address = this.address();
  console.log('API server listening at http://%s:%s', server_address.address,
      server_address.port);
});
