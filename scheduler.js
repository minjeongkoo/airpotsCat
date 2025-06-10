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

  // 매일 오후 5시 30분에 실행 (서버 시간 기준)
  cron.schedule('30 17 * * *', () => {
    console.log(`[Scheduler] Running at 17:30`);
    runScheduler(client);
  });

  // 봇 시작 시 한 번 테스트 실행 (선택사항)
  runScheduler(client);
});

client.login(process.env.DISCORD_TOKEN);
