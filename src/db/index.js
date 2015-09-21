var pg = require('pg');

var zeroRowsError = 'Got zero results';

var manyRowsError = 'Got too many results.';

/**
 * 
 * @param conString
 *          for example postgres://username:password@localhost/database
 */
module.exports = function(conString) {
  // With connString build the function to execute one query.
  function query(queryString, queryArgs, callback) {
    // Connect, handle any error or execute the query.
    pg.connect(conString, function(err, client, done) {
      if (err) {
        callback(err);
      } else {
        // Make the query, free the connection call callback.
        client.query(queryString, queryArgs, function(err, result) {
          done();
          callback(err, result);
        });
      }
    });
  };
  return {
    zeroRowsError: zeroRowsError,
    manyRowsError: manyRowsError,
    /**
     * Execute one query.
     * 
     * @param queryString
     * @param queryArgs
     *          array of values to pass to the DB for the query string
     * @param callback
     *          function(err, result)
     */
    query: query,
    /**
     * Execute one query and return the one and only row. Set an error if the
     * result did not contain exactly one row.
     * 
     * @param callback
     *          function(err, row)
     */
    queryOne: function(queryString, queryArgs, callback) {
      query(queryString, queryArgs, function(err, result) {
        var row = undefined;
        if (!err) {
          var rows = result.rows;
          if (rows.length !== 1) {
            err = rows.length === 0 ? zeroRowsError : manyRowsError;
          } else {
            row = rows[0];
          }
        }
        callback(err, row);
      });
    },
    /**
     * Insert values into a table (one row).
     * 
     * @param tableName
     *          table name as a string
     * @param columns
     *          array of column names (strings)
     * @param values
     *          array of column values to be inserted
     * @param callback
     *          function(err)
     */
    insertOne: function(tableName, columns, values, callback) {
      var argsPlaceholders = [];
      for (var i = 0; i < values.lenght; i++) {
        argsPlaceholders.push('$' + (i + 1));
      }
      var sql = [
        'INSERT INTO', tableName, ' (', columns.join(','), ') VALUES (',
        argsPlaceholders.join(','), ')'].join(' ');
      query(sql, values, function(err, result) {
        callback(err);
      });
    },
    /**
     * Update columns of a table for a specific row.
     * 
     * @param tableName
     *          table name as a string
     * @param columns
     *          array of column names (strings)
     * @param where
     *          optional where clause, mind placeholder numbering
     * @param values
     *          array of new column values, has to include values for where
     *          clause if necessary
     * @param callback
     *          function(err)
     */
    update: function(tableName, columns, where, values, callback) {
      var setColumns = [];
      for (var i = 0; i < columns.length; i++) {
        setColumns.push(columns[i] + '=$' + (i + 1));
      }
      var sql = [
        'UPDATE ', tableName, ' SET ', setColumns.join(',')];
      if (where) {
        sql.push(' WHERE ');
        sql.push(where);
      }
      query(sql.join(' '), values, function(err, result) {
        callback(err);
      });
    }
  };
};
