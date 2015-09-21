var crypto = require('crypto');

var userModule = require('./db/user');
var responses = require('./responses');

var SALT_LENGTH = 8;

var HASH_ITERATIONS = 2048;

var HASH_KEY_LENGTH = 32;

/**
 * Hash the password with salt and generate a ready to be stored in the DB
 * string in the form of:
 * SALT_LENGTH $ SALT PASSWORD_HASH
 * 
 * @param secret
 *          the plain text password
 * @param salt
 *          some random symbols for "salting" the hash
 * @param callback
 *          function(err, encrypted)
 */
function encryptPassword(secret, salt, callback) {
  if (!salt) {
    salt = Math.round((new Date().valueOf() * Math.random())) + '';
  }
  crypto.pbkdf2(secret, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, function(err,
      key) {
    var encrypted = undefined;
    if (!err) {
      encrypted = key.toString('hex'); // 'c5e478d...1469e50'
      encrypted = salt.length + '$' + salt + encrypted;
    }
    callback(err, encrypted);
  });
}

/**
 * Encrypt (hash plus added salt) the password provided by the user and comapre
 * it with what is in the database.
 * 
 * @param userPwd
 *          plain text password from the user input
 * @param dbPwd
 *          hashed and salted password string from the DB
 * @param callback
 *          function(err, same)
 */
function comarePassword(userPwd, dbPwd, callback) {
  var dbPwdParts = dbPwd.split('$')
  var saltLength = parseInt(dbPwdParts[0]);
  if (!saltLength) {
    callback('Corrupt password value in DB.');
  } else {
    var salt = dbPwdParts[1].substring(0, saltLength);
    encryptPassword(userPwd, salt, function(err, encrypted) {
      var same = undefined;
      if (!err) {
        same = (encrypted == dbPwd);
      }
      callback(err, same);
    });
  }
}

/**
 * Helper function to create a random UUID.
 * 
 * @returns UUID as a string
 */
function genUUID4() {
  // From http://stackoverflow.com/a/2117523
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    var v = (c == 'x') ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = function(conString) {
  var user = userModule(conString);
  return {
    /**
     * Encrypt and set password for user.
     * 
     * @param username
     * @param password
     *          in plain text
     * @param callback
     *          function(err)
     */
    setPasswordForUsername: function(username, password, callback) {
      encryptPassword(password, undefined, function(err, encrypted) {
        if (err) {
          callback(err);
        } else {
          user.setPasswordForUsername(username, encrypted, callback);
        }
      });
    },
    /**
     * Checks user name and password. Calls the callback with the userID if the
     * credentials are correct.
     * 
     * @param callback
     *          function(err, userID).
     */
    authenticate: function(username, password, callback) {
      user.getPasswordByUsername(username, function(err, dbPwd, userID) {
        if (err) {
          callback(err);
        } else {
          comparePassword(password, dbPwd, function(err, same) {
            if (err) {
              userID = undefined;
            } else if (!same) {
              err = "Credentials not accepted.";
              userID = undefined;
            }
            callback(err, userID);
          });
        }
      });
    },
    /**
     * Create and set an authentication token for a user. As for now a token
     * does not have a time to live.
     * 
     * @param callback
     *          function(err, token).
     */
    createAndSetToken: function(userID, callback) {
      var token = genUUID4();
      user.setTokenForUserID(userID, token, function(err) {
        if (err) {
          token = undefined;
        }
        callback(err, token);
      });
    },
    /**
     * Does check the 'Authorization' header and adds userID to res.local if the
     * token from the header grants access.
     * 
     * Authorization header format for the token TOKEN and the user id USERID:
     * "Authorization: Token TOKEN USERID"
     */
    authMiddleware: function timeLog(req, res, next) {
      var tokenParts = (req.headers['authorization'] || '').split(' ');
      // Check correct from of the "Authorization: Token TOKEN USERID" header.
      if (tokenParts.length !== 3 || tokenParts[0] !== 'Token') {
        responses.sendStatus(res, 400);
      } else {
        var reqToken = tokenParts[1];
        var userID = parseInt(tokenParts[2]);
        user.getTokenByUserID(userID, function(err, token) {
          if (err) {
            responses.sendStatus(res, 403, err);
          } else {
            if (reqToken !== token) {
              responses.sendStatus(res, 401);
            } else {
              // Token does match, set userID and continue.
              res.locals.userID = userID;
              next();
            }
          }
        });
      }
    },
  };
};
