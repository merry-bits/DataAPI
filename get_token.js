/**
 * Tool to get the token for a user. The connection string should be something
 * like postgres://username:password@localhost/database
 * 
 *  $ node get_token DB_CONN_STRING USERNAME
 */
var userModule = require('./src/db/user');

var conString = process.argv[2];
var username = process.argv[3];
var user = userModule(conString);

// Get the userID for the user name.
user.getPasswordByUsername(username, function(err, password, userID) {
  if (err) {
    console.log(err);
    process.exit(1);
  } else {
    // Get the token.
    user.getTokenByUserID(userID, function(err, token) {
      if (err) {
        console.log(err);
        process.exit(1);
      } else {
        console.log('Token: ' + token);
        process.exit();
      }
    });
  }
});
