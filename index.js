import express from 'express';
import pg from 'pg';
import jsSHA from 'jssha';

/*
 * ===============================
 * ===============================
 * ===============================
    POSTGRES
 * ===============================
 * ===============================
 * ===============================
 */

const { Pool } = pg;

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

/*
 * ===============================
 * ===============================
 * ===============================
    EXPRESS CONFIG
 * ===============================
 * ===============================
 * ===============================
 */

const app = express();

app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3004;

/*
 * ===============================
 * ===============================
 * ===============================
    USER AUTH
 * ===============================
 * ===============================
 * ===============================
 */

const getHash = (input) => {
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(input);
  return shaObj.getHash('HEX');
}


const checkAuth = (request, response, next) => {
  // set the default value
  request.isUserLoggedIn = false;

  // check to see if the cookies you need exists
  if (request.cookies.loggedInHash && request.cookies.userId) {
    // get the hased value that should be inside the cookie
    const hash = getHash(request.cookies.userId);

    // test the value of the cookie
    if (request.cookies.loggedInHash === hash) {
      request.isUserLoggedIn = true;
    }
  }
  next();
};

/*
 * ===============================
 * ===============================
 * ===============================
    EXPRESS ROUTES
 * ===============================
 * ===============================
 * ===============================
 */

app.get('/register', (request, response) => {
  response.send(`
    <html>
      <body>
        <form action="/register" method="POST">
          <input type="text" name="email"/>
          <input type="text" name="password"/>
          <input type="submit"/>
        </form>
      </body>
    </html>
  `);
});

app.post('/register', (request, response) => {

  const values = [request.body.email, getHash(request.body.password)];

  pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', values)
    .then((result) => {
      response.send('done');
    }).catch((result) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

app.get('/login', (request, response) => {
  response.send(`
    <html>
      <body>
        <form action="/login" method="POST">
          <input type="text" name="email"/>
          <input type="text" name="password"/>
          <input type="submit"/>
        </form>
      </body>
    </html>
  `);
});

app.post('/login', (request, response) => {

  pool.query('SELECT * from users WHERE email=$1', [request.body.email])
    .then((result) => {
      // console.log(result.rows[0].name);
      if( result.rows.length === 0 ){
        response.status(403).send('sorry');
      }

      const user = result.rows[0];

      if( user.password !=== getHash(request.body.password) ){
        response.status(403).send('sorry');
      }

      response.cookie('loggedInHash', hashedCookieString);
      response.cookie('userId', user.id);
      response.send('worked');

    }).catch((result) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

app.get('/', (request, response) => {

  pool.query('SELECT * from cats')
    .then((result) => {
      // console.log(result.rows[0].name);
      response.send(result.rows);
    }).catch((result) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

app.listen(PORT);
