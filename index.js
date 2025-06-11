// index.js
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { initGuildInDatabase } = require('./db');
const commandModule = require('./commands');

require('dotenv').config();

// Database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await commandModule.execute(interaction, client);
});

client.login(process.env.BOT_TOKEN);

client.on('voiceStateUpdate', (oldState, newState) => {
  const user = newState.member?.user;
  const guildId = newState.guild?.id;

  // 음성 채널에 새로 참여한 경우만 처리
  if (!oldState.channel && newState.channel && user && guildId) {
    const now = new Date().toISOString();
    db.run(`
      INSERT INTO voice_logs (guild_id, user_id, last_joined_at)
      VALUES (?, ?, ?)
      ON CONFLICT(guild_id, user_id) DO UPDATE
      SET last_joined_at = excluded.last_joined_at
    `, [guildId, user.id, now], (err) => {
      if (err) {
        console.warn(`[${guildId}] ${user.username} 음성 참여 기록 실패:`, err.message);
      } else {
        console.log(`[${guildId}] ${user.username} 참여 기록 업데이트됨 (${now})`);
      }
    });
  }
});

// 봇이 서버에 처음 초대될 때 기존 유저 초기화
client.on('guildCreate', async guild => {
  const members = await guild.members.fetch();
  const now = new Date().toISOString();

  console.log(`--- 새 서버에 추가됨: ${guild.name} ---`);
  await initGuildInDatabase(guild.id);

  for (const member of members.values()) {
    if (member.user.bot) continue;
    db.run(`
      INSERT OR IGNORE INTO voice_logs (guild_id, user_id, last_joined_at)
      VALUES (?, ?, ?)`, [guild.id, member.user.id, now]
    );
  }

  console.log(`[${guild.id}] 봇 초대됨 → 유저 ${members.size}명 초기화`);
});

// 새 유저가 들어올 때 자동 등록
client.on('guildMemberAdd', member => {
  if (member.user.bot) return;

  const now = new Date().toISOString();
  db.run(`
    INSERT OR IGNORE INTO voice_logs (guild_id, user_id, last_joined_at)
    VALUES (?, ?, ?)`, [member.guild.id, member.user.id, now]
  );

  console.log(`[${member.guild.id}] ${member.user.username} 새 유저 등록`);
});

// client.on('messageCreate', message => {
//   console.log(message.channel.type, message.author.bot);
//   if (message.channel.type === 1 && !message.author.bot) {
//     // type 1 : DM 채널
//     message.reply('안녕하세요. 이 봇은 DM으로 동작하지 않습니다.\n서버 내에서 명령어를 사용해주세요. :1381821353325236284:');
//   }
// });