CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  auth_token VARCHAR
) WITH (
  OIDS=FALSE
);

CREATE TABLE households(
  id SERIAL PRIMARY KEY,
  address VARCHAR NOT NULL,
  postal_code INTEGER
) WITH (
  OIDS=FALSE
);

CREATE TABLE user_household(
  user_id  INTEGER REFERENCES users(id) NOT NULL,
  household_id INTEGER REFERENCES households(id) NOT NULL,
  PRIMARY KEY(user_id,household_id)
) WITH (
  OIDS=FALSE
);

CREATE TABLE household_timeseries(
  household_id INTEGER REFERENCES households(id) NOT NULL,
  pointintime TIMESTAMP NOT NULL,
  temperature REAL,
  consumption REAL,
  cost REAL,
  PRIMARY KEY(household_id,pointInTime)
) WITH (
  OIDS=FALSE
);