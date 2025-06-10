// init-db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS configs`);
  db.run(`DROP TABLE IF EXISTS admins`);
  db.run(`DROP TABLE IF EXISTS excluded`);
  db.run(`DROP TABLE IF EXISTS voice_logs`);

  db.run(`
    CREATE TABLE configs (
      guild_id TEXT,
      key TEXT,
      value TEXT,
      PRIMARY KEY (guild_id, key)
    )
  `);

  db.run(`
    CREATE TABLE admins (
      guild_id TEXT,
      user_id TEXT,
      PRIMARY KEY (guild_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE excluded (
      guild_id TEXT,
      user_id TEXT,
      PRIMARY KEY (guild_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE voice_logs (
      guild_id TEXT,
      user_id TEXT,
      last_joined_at TEXT,
      PRIMARY KEY (guild_id, user_id)
    )
  `);

  console.log("✅ DB 초기화 완료");
});

db.close();
