var express = require('express');
var bodyParser = require('body-parser')
var fs = require('fs');  
var hljs = require('highlight.js');

var authModule = require('./auth');
var timeseriesModule = require('./db/timeseries');
var responses = require('./responses');

/**
 * Create function that sends rows (or a 500) to the client.
 * 
 * @param res
 *          Node res object
 * @returns {Function}
 *            function(err, rows)
 */
function sendRows(res) {
  return function(err, rows) {
    if (err) {
      responses.sendStatus(res, 500, err);
    } else {
      res.json(rows);
    }
  };
}

module.exports = function(conString) {
  var auth = authModule(conString);
  var timeseries = timeseriesModule(conString);
  var router = express.Router();
  
  router.use(bodyParser.json());

  // Display README.md
  router.get('/', function(req, res) {
    lang = 'markdown';
    fs.readFile('README.md', function (err, data) {
      if (err) {
        responses.sendStatus(res, 500, err);
      } else {
        var html = [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '<meta charset="utf-8" />',
          '<link rel="stylesheet" ' + 
          'href="http://cdnjs.cloudflare.com/' + 
          'ajax/libs/highlight.js/8.8.0/styles/default.min.css">',
          '</head>',
          '<body>',
          '<pre><code class="hljs ' + lang + '">',  
          hljs.highlight(lang, data.toString('utf-8')).value,
          '</code></pre>',
          '</body>',
          '</html>',
        ];
        res.send(html.join('\n'));
      }
    });
  });

  // Authenticate user and return the access token.
  router.post('/login', function(req, res) {
    auth.authenticate(req.username, req.password, function(err, userID) {
      if (err) {
        responses.sendStatus(res, 401, err);
      } else {
        auth.createAndSetToken(function(err, token) {
          if (err) {
            responses.sendStatus(res, 503, err);
          } else {
            res.json({userID:userID, token: token});
          }
        });
      }
    });
  });

  // Return a list of time series.
  // TODO: add pagination, would be nice to have
  router.get('/timeseries', auth.authMiddleware, function(req, res) {
    var userID = res.locals.userID;
    var day = req.query.day;
    if (day) {
      day = day.split('-');
      if (day.length != 3) {
        response.sendStatus(res, 400);
      } else {
        day = new Date(Date.UTC(day[0], day[1] - 1, day[2]));
        if (isNaN(day.getDate())) {
          response.sendStatus(res, 400);
        } else {
          var days = req.query.days;
          if (days) {
            days = parseInt(days);
            if (isNaN(days)) {
              response.sendStatus(res, 400);
            } else {
              timeseries.days(userID, day, days, sendRows(res));
            }
          } else {
            timeseries.days(userID, day, 1, sendRows(res));
          }
        }
      }
    } else {
      timeseries.all(userID, sendRows(res));
    }
  });

  return router;
};
