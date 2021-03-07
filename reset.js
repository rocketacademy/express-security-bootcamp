import pg from 'pg';

const { Client } = pg;

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

const client = new Client(pgConnectionConfigs);

client.connect();

client.query('DELETE FROM users').then(result=>{
  client.query('DELETE FROM cats').then(result=>{
    client.end();
  });
}).catch(error =>{
  console.error('error', error);
});
