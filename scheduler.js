// scheduler.js
const cron = require('node-cron');
const runScheduler = require('./scheduler-core');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once('ready', () => {
  console.log(`Scheduler bot ready as ${client.user.tag}`);

  // 서버 타임존 기준임
  cron.schedule('22 00 * * *', () => {
    console.log(`[Scheduler] Running at 17:30`);
    runScheduler(client);
  });

  // 봇 시작 시 한 번 테스트 실행 (선택사항)
  // runScheduler(client);
});

client.login(process.env.BOT_TOKEN);
