const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS config (
    guild_id TEXT, key TEXT, value TEXT,
    PRIMARY KEY (guild_id, key)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admin (
    guild_id TEXT, user_id TEXT,
    PRIMARY KEY (guild_id, user_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS excluded (
    guild_id TEXT, user_id TEXT,
    PRIMARY KEY (guild_id, user_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS voice_log (
    user_id TEXT PRIMARY KEY, last_join TEXT
  )`);
});

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,

  // config
  async setConfig(guildId, key, value) {
    await run(
      `INSERT INTO config (guild_id, key, value)
       VALUES (?, ?, ?)
       ON CONFLICT(guild_id, key) DO UPDATE SET value = ?`,
      [guildId, key, value, value]
    );
  },

  async getConfig(guildId, key) {
    const row = await get(
      `SELECT value FROM config WHERE guild_id = ? AND key = ?`,
      [guildId, key]
    );
    return row?.value;
  },

  // admin
  async addAdmin(guildId, userId) {
    await run(
      `INSERT OR IGNORE INTO admin (guild_id, user_id) VALUES (?, ?)`,
      [guildId, userId]
    );
  },

  async getAdmins(guildId) {
    const rows = await all(
      `SELECT user_id FROM admin WHERE guild_id = ?`,
      [guildId]
    );
    return rows.map(r => r.user_id);
  },

  // excluded
  async excludeUser(guildId, userId) {
    await run(
      `INSERT OR IGNORE INTO excluded (guild_id, user_id) VALUES (?, ?)`,
      [guildId, userId]
    );
  },

  async getExcluded(guildId) {
    const rows = await all(
      `SELECT user_id FROM excluded WHERE guild_id = ?`,
      [guildId]
    );
    return rows.map(r => r.user_id);
  },

  // voice_log
  async updateVoiceLog(userId, date) {
    await run(
      `INSERT INTO voice_log (user_id, last_join)
       VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET last_join = ?`,
      [userId, date, date]
    );
  },

  async getVoiceLogs() {
    return await all(`SELECT * FROM voice_log`);
  },

  // 초기화
  async resetGuildData(guildId) {
    await run(`DELETE FROM config WHERE guild_id = ?`, [guildId]);
    await run(`DELETE FROM admin WHERE guild_id = ?`, [guildId]);
    await run(`DELETE FROM excluded WHERE guild_id = ?`, [guildId]);
  }
};
