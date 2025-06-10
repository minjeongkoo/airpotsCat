const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS config`);
  db.run(`DROP TABLE IF EXISTS admins`);
  db.run(`DROP TABLE IF EXISTS excluded`);
  db.run(`DROP TABLE IF EXISTS voice_logs`);
  console.log('✅ 모든 테이블이 초기화되었습니다!');
});
