var dbModule = require("../db");

var selectPasswordWithUsername = (
    'SELECT id, password FROM users WHERE username=$1');

var selectToken = 'SELECT auth_token FROM users WHERE id=$1';

module.exports = function(conString) {
  db = dbModule(conString);
  return {
    /**
     * @param username
     * @param password
     *          encrypted, ready to be stored in the DB
     * @param callback
     *          function(err)
     */
    setPasswordForUsername: function(username, password, callback) {
      db.update('users', ['password'], 'username=$2', [password, username],
          callback);
    },
    /**
     * Get the password and id for a user.
     * 
     * @param username
     * @param callback
     *          function(err, password, userID)
     */
    getPasswordByUsername: function(username, callback) {
      db.queryOne(selectPasswordWithUsername, [username], function(err, row) {
        var password = undefined;
        var userID = undefined;
        if (!err) {
          password = row.password;
          userID = row.id;
        }
        callback(err, password, userID);
      });
    },
    /**
     * @param userID
     * @param callback
     *          function(err, token)
     */
    getTokenByUserID: function(userID, callback) {
      db.queryOne(selectToken, [userID], function(err, row) {
        var token = undefined;
        if (!err) {
          token = row.auth_token;
        }
        callback(err, token);
      })
    },
    /**
     * @param userID
     * @param token
     * @param callback
     *          function(err)
     */
    setTokenForUserID: function(userID, token, callback) {
      db.update('users', ['auth_token'], 'id=$2', [token, userID], function(
          err, result) {
        callback(err);
      });
    }
  };
};
