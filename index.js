import express from 'express';
const app = express();

import pg from 'pg';
const { Pool } = pg;

const PORT = process.env.PORT || 3004;

let pgConnectionConfigs;

// test to see if the env var is set. Then we know we are in Heroku
if (process.env.DATABASE_URL) {
  // pg will take in the entire value and use it to connect
  pgConnectionConfigs = {
    connectionString: process.env.DATABASE_URL,
  };
} else {
  // this is the same value as before
  pgConnectionConfigs = {
    user: '<MY_UNIX_USERNAME>',
    host: 'localhost',
    database: '<MY_UNIX_USERNAME>',
    port: 5432,
  };
}

const pool = new Pool(pgConnectionConfigs);

app.get('/', (request, response) => {
  console.log('request came in');
  response.send('yay');
});

app.get('/banana', (request, response) => {
  console.log('request came in');

  const whenDoneWithQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }

    console.log(result.rows[0].name);

    response.send(result.rows);
  };

  // Query using pg.Pool instead of pg.Client
  pool.query('SELECT * from cats', whenDoneWithQuery);
});

app.listen(PORT);
