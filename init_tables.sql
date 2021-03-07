CREATE TABLE IF NOT EXISTS cats (
  id SERIAL PRIMARY KEY,
  name TEXT,
  type TEXT,
  user_id INTEGER
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT,
  password TEXT
);
