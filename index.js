import express from 'express';
import pg from 'pg';
import jsSHA from 'jssha';
import cookieParser from 'cookie-parser';

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
    user: 'akira',
    host: 'localhost',
    database: 'foobar',
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

app.use(cookieParser());

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

const navbar = `<p>navbar🥖<a href="/">home</a>🥖<a href="/dashboard">dashboard</a>🥖<a href="/cats/new">new cat</a>🥖<a href="/user/edit">edit your profile</a>🥖<a href="/login">login</a>🥖<a href="/register">register</a>`;


/*
 * ===============================
    User Auth
 * ===============================
 */

app.get('/register', (request, response) => {
  response.send(`
    <html>
      <body>
        ${navbar}
        <form action="/register" method="POST">
          email <input type="text" name="email"/>
          🔴passowrd <input type="text" name="password"/>
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
    }).catch((error) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

app.get('/login', (request, response) => {
  response.send(`
    <html>
      <body>
        ${navbar}
        <form action="/login" method="POST">
          email <input type="text" name="email"/>
          🔴passowrd <input type="text" name="password"/>
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

      if( user.password !== getHash(request.body.password) ){
        response.status(403).send('sorry');
      }

      response.cookie('loggedInHash', getHash(`${user.id}`)); // not salted, fix later
      response.cookie('userId', user.id);

      response.send('worked');

    }).catch((error) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

/*
 * ===============================
    User Edit
 * ===============================
 */

app.get('/user/edit', (request, response) => {
  response.send(`
    <html>
      <body>
        ${navbar}
        <form action="/user/edit">
          email <input type="text" name="email"/>
          🔴password <input type="text" name="password"/>
          <input type="submit"/>
        </form>
      </body>
    </html>
  `);
});

app.get('/user/edit', (request, response) => {

  const values = [
    request.body.email,
    getHash(request.body.password),
    request.cookies.userId
  ];

  pool.query('UPDATE users SET email=$1 password=$2 WHERE id=$3', values)
    .then((result) => {
      response.send('done');
    }).catch((error) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

/*
 * ===============================
    Dashboard
 * ===============================
 */

app.get('/dashboard', checkAuth, (request, response) => {

  if( request.isUserLoggedIn === false ){
    return response.status(403).send('sorry');
  }

  pool.query('SELECT * from cats WHERE user_id=$1', [request.cookies.userId])
    .then((result) => {
      const cats = result.rows.map(cat => `<p><a href="/cats/${cat.id}">${cat.id}|${cat.name}</a></p>`);

      response.send(`
          <html>
            <body>
              ${navbar}
              ${cats.join('')}
            </body>
          </html>
        `);

    }).catch((error) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

/*
 * ===============================
    Cats
 * ===============================
 */

app.post('/cats', checkAuth, (request, response) => {

  if( request.isUserLoggedIn === false ){
    return response.status(403).send('sorry');
  }

  const values = [request.body.name, request.body.type, request.cookies.userId];

  pool.query('INSERT INTO cats (name, type, user_id) VALUES ($1, $2, $3)', values)
    .then((result) => {
      response.send('done');
    }).catch((error) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

// render a form to create a cat
app.get('/cats/new', (request, response) => {
  response.send(`
    <html>
      <body>
        ${navbar}
        <form action="/cats" method="POST">
          name <input type="text" name="name"/>
          🔴type <input type="text" name="type"/>
          <input type="submit"/>
        </form>
      </body>
    </html>
  `);
});

// get one cat
app.get('/cats/:id', (request, response) => {

  pool.query('SELECT * from cats WHERE id='+request.params.id)
    .then((result) => {

      const cat = result.rows[0];

      response.send(`
          <html>
            <body>
              ${navbar}
              <p>${cat.id} | ${cat.name} | ${cat.type}</p>
            </body>
          </html>
        `);

    }).catch((error) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

/*
 * ===============================
    Homepage
 * ===============================
 */

app.get('/', (request, response) => {

  pool.query('SELECT * from cats')
    .then((result) => {

      const cats = result.rows.map(cat => `<p><a href="/cats/${cat.id}">${cat.id}|${cat.name}</a></p>`);

      response.send(`
          <html>
            <body>
              ${navbar}
              ${cats.join('')}
            </body>
          </html>
        `);

    }).catch((error) => {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry');
    });
});

app.listen(PORT);
