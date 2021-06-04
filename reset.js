import pg from 'pg';

const { Client } = pg;

let pgConnectionConfigs;

// test to see if the env var is set. Then we know we are in Heroku
if (process.env.DATABASE_URL) {
  // pg will take in the entire value and use it to connect
  pgConnectionConfigs = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
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

const client = new Client(pgConnectionConfigs);

client.connect();

client.query('DELETE FROM users').then(result=>{
  client.query('DELETE FROM cats').then(result=>{


    const queryStrings = [
      "INSERT INTO users (email, password) VALUES ('kai@ra.com', '3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1eb8b85103e3be7ba613b31bb5c9c36214dc9f14a42fd7a2fdb84856bca5c44c2')",

      "INSERT INTO users (email, password) VALUES ('jai@ra.com', '3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1eb8b85103e3be7ba613b31bb5c9c36214dc9f14a42fd7a2fdb84856bca5c44c2')",

      "INSERT INTO cats (name, type, user_id) VALUES ('Mr. Snuggles', 'Calico', 1)",
      "INSERT INTO cats (name, type, user_id) VALUES ('Jake AlPurrrrtsen', 'Bambino', 1)",
      "INSERT INTO cats (name, type, user_id) VALUES ('Furry Mc Furmeister', 'Persian', 1)",
      "INSERT INTO cats (name, type, user_id) VALUES ('kai', 'LaPerm', 2)"
    ];

    const resultPromises = [];

    for( let i=0; i<queryStrings.length; i++ ){
      resultPromises.push( client.query(queryStrings[i]) );
    }

    Promise.all( resultPromises ).then( results => {

      console.log( results );
      client.query('DELETE FROM cats')
    });

    client.end();
  });
}).catch(error =>{
  console.error('error', error);
});
