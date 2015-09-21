# Data API

Example for login protected data retrieval with NodeJS and PostgreSQL.


# API

The API does allow the exchange of security critical data (password, token) in
plain text, which means the API should only be made accessible over HTTPS!


## /api/

Display this page.


## /api/login (POST)

Login a user and get the token, needed to make a call to other end points.
As for now the token does not expire but gets created anew every time login is
called.

Mind that the passwords in the database are encrypted. That means you need to
set the password for the user first, before you can actually login. The
`set_pwd.js` script can do that for you.


## Request

- username: (string) the username
- password: (string) the users password, plain text

## Response

- token: (string) the (new) access token for the user
- userID: (int) the users id, needed together with the token to make other
    calls

If the HTTP status code is not 200 then the response body may contain
additional error information in plain text for debugging purpose.


## /api/timeseries (GET)

Lets a user with the right access token access the time series of their
households.


## Authorization

Needs the access token (obtained with a login call) and the users id in the
HTTP authorization header, separated by space like so:
```
    Authorization: Token TOKEN USERID
```


## Request

- day (optional): (yyyy-mm-dd) date (year-month-day) constraint for the data
- days (optional): (int) together with day a date interval constraint for the
    result data


## Response

List of time series sorted by household and pointintime. For example:

```json
    [
      {
        "household_id": 2,
        "pointintime": "2015-01-01T00:00:00.000Z",
        "temperature": 17,
        "consumption": 0.92,
        "cost": 140.54
      },
      {
        "household_id": 2,
        "pointintime": "2015-01-01T01:00:00.000Z",
        "temperature": 20,
        "consumption": 0.65,
        "cost": 137.5
      }
    ]
```

If the HTTP status code is not 200 then the response body may contain
additional error information in plain text for debugging purpose.


# Install and run

The project is set up as a NPM package. To run the server an up and running
PostgreSQL database on which `db/schema.sql` and `db/schema.sql` have been
run is needed as well.
Install and run the server:


```bash
    $ npm install
    $ node server.js POSTGRES_CONNECTION_STRING
```

The POSTGRES_CONNECTION_STRING could be something like:
`postgres://USER:PASSWORD@127.0.0.1/DATABSENAME`

The node version this project was test run on is `v0.10.25`. To check the
workings of the API the [Chrome](http://www.google.com/chrome/) extension
[Postman](https://www.getpostman.com/) was used.



# Solution

The server is implemented using [NodeJS](https://nodejs.org/) and
[Express](http://expressjs.com/). The `db` folder in source contains all the
code for accessing the database. It provides helper functions to read data from
the tables.

This data is then used by `auth.js` and `api.js` to build an API router, used
in the `server.js` script. The auth part also implements an authentication
middleware that checks the `Authorization` header before calling the next
handler. It also adds the user id to `locals` in the response.



# Directories and files

- db/: contains the SQL files to populate the database
- src/: contains the bulk of the source code
- get_token.js: script to read the token of an user:
    `$ node get_token DB_CONN_STRING USERNAME`
- README.md: this file
- server.js: the server script, use this to run the server
- set_pwd.js: set the password for an user:
    `$ node set_pwd DB_CONN_STRING USERNAME PASSWORD`
