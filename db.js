const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// 테이블 초기화
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS configs (
      guild_id TEXT,
      key TEXT,
      value TEXT,
      PRIMARY KEY (guild_id, key)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      guild_id TEXT,
      user_id TEXT,
      PRIMARY KEY (guild_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS excludes (
      guild_id TEXT,
      user_id TEXT,
      PRIMARY KEY (guild_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS voice_logs (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      last_joined_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    )
  `);
});

const initGuildInDatabase = (guild) => {
  const now = new Date().toISOString();

  guild.members.fetch().then(() => {
    const stmt = db.prepare(`
      INSERT INTO voice_logs (guild_id, user_id, last_joined_at)
      VALUES (?, ?, ?)
      ON CONFLICT(guild_id, user_id) DO UPDATE SET last_joined_at = excluded.last_joined_at
    `);

    for (const [_, member] of guild.members.cache) {
      if (!member.user.bot) {
        stmt.run(guild.id, member.user.id, now);
      }
    }

    stmt.finalize();
    console.log(`[Success] ${guild.name} 서버의 유저 참여시각 초기화 완료`);
  }).catch(err => {
    console.warn(`[Fail] ${guild.name} 서버의 유저 불러오기 실패:`, err.message);
  });
};

// 설정 저장 및 조회
function setConfig(guildId, key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO configs (guild_id, key, value)
       VALUES (?, ?, ?)
       ON CONFLICT(guild_id, key) DO UPDATE SET value = excluded.value`,
      [guildId, key, value],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

function getConfig(guildId, key) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT value FROM configs WHERE guild_id = ? AND key = ?`,
      [guildId, key],
      (err, row) => (err ? reject(err) : resolve(row?.value))
    );
  });
}

// 관리자 추가/조회
function addAdmin(guildId, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO admins (guild_id, user_id) VALUES (?, ?)`,
      [guildId, userId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

function getAdmins(guildId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT user_id FROM admins WHERE guild_id = ?`,
      [guildId],
      (err, rows) => (err ? reject(err) : resolve(rows.map(r => r.user_id)))
    );
  });
}

// 제외 유저 추가/조회
function excludeUser(guildId, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO excludes (guild_id, user_id) VALUES (?, ?)`,
      [guildId, userId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

function removeExcludedUser(guildId, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM excludes WHERE guild_id = ? AND user_id = ?`,
      [guildId, userId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// 관리자에서 제거
function removeAdmin(guildId, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM admins WHERE guild_id = ? AND user_id = ?`,
      [guildId, userId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function getExcluded(guildId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT user_id FROM excludes WHERE guild_id = ?`,
      [guildId],
      (err, rows) => (err ? reject(err) : resolve(rows.map(r => r.user_id)))
    );
  });
}

// 음성 참여 로그 기록
function logVoiceActivity(guildId, userId, username = '') {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO voice_logs (guild_id, user_id, last_joined_at)
     VALUES (?, ?, ?)
     ON CONFLICT(guild_id, user_id) DO UPDATE
     SET last_joined_at = excluded.last_joined_at`,
    [guildId, userId, now],
    (err) => {
      if (err) {
        console.warn(`[${guildId}] ${username} 음성 참여 기록 실패:`, err.message);
      } else {
        console.log(`[${guildId}] ${username} 참여 기록 업데이트됨 (${now})`);
      }
    }
  );
}

// 음성 참여 로그 조회
function getAllVoiceLogs(guildId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT user_id, last_joined_at FROM voice_logs WHERE guild_id = ?`,
      [guildId],
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });
}

// 모든 서버 ID 조회
function getAllGuildIds() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT guild_id FROM configs`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows.map(r => r.guild_id)))
    );
  });
}

// 설정 초기화
function resetGuildData(guildId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM configs WHERE guild_id = ?`, [guildId]);
      db.run(`DELETE FROM admins WHERE guild_id = ?`, [guildId]);
      db.run(`DELETE FROM excludes WHERE guild_id = ?`, [guildId]);
      db.run(`DELETE FROM voice_logs WHERE guild_id = ?`, [guildId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

module.exports = {
  db,
  initGuildInDatabase,
  setConfig,
  getConfig,
  addAdmin,
  getAdmins,
  excludeUser,
  getExcluded,
  logVoiceActivity,
  getAllVoiceLogs,
  getAllGuildIds,
  resetGuildData,
  removeExcludedUser,
  removeAdmin,
};
