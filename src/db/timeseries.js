var dbModule = require("../db");

var columns = 'household_id, pointintime, temperature, consumption, cost';

select_day = (
  'SELECT ' + columns + ' ' +
  'FROM user_household ' +
  'JOIN household_timeseries USING(household_id) ' +
  'WHERE user_id=$1 AND pointintime>=$2 AND ' +
  '    pointintime<($2 + $3 * interval \'1 day\') ' +
  'ORDER BY household_id, pointInTime');

select_all = (
  'SELECT ' + columns + ' ' +
  'FROM user_household ' +
  'JOIN household_timeseries USING(household_id) ' +
  'WHERE user_id=$1 ' +
  'ORDER BY household_id, pointInTime ' +
  'LIMIT 100');

/**
 * Create function that passes rows (or err) to the callback.
 * 
 * @param callback
 *          function(err, rows)
 * @returns {Function}
 *            function(err, result)
 */
function returnRows(callback) {
  return function(err, result) {
    var rows = undefined;
    if (!err) {
      rows = result.rows;
    } else {
      console.log(err);
    }
    callback(err, rows);
  };
}

// TODO: limit and offset are not implemented, would be nice to have
module.exports = function(conString) {
  db = dbModule(conString);
  return {
    /**
     * Get time series rows for given user and days starting from day. 
     * Sorted by household_id and pointInTime.
     * 
     * @param userID
     * @param day
     * @param days
     * @param callback 
     *          function(err, rows)
     */
    days: function(userID, day, days, callback) {
      db.query(select_day, [userID, day, days], returnRows(callback));
    },
    /**
     * Get 100 time series for given user. 
     * Sorted by household_id and pointInTime.
     * 
     * @param userID
     * @param callback
     *          function(err, rows)
     */
    all: function(userID, callback) {
      db.query(select_all, [userID], returnRows(callback));
    },
  };
};

