/**
 * Tool to set a user password. Only the encrypted version will be stored in the
 * DB. The connection string should be something like
 * postgres://username:password@localhost/database
 *
 * $ node set_pwd DB_CONN_STRING USERNAME PASSWORD
 */
var authModule = require('./src/auth');

var conString = process.argv[2];
var username = process.argv[3];
var password = process.argv[4];

authModule(conString).setPasswordForUsername(username, password, function(err) {
  if (err) {
    console.log(err);
    process.exit(1);
  } else {
    console.log('Password changed');
    process.exit();
  }
});
