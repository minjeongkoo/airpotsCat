// deploy-commands.js
const { REST, Routes } = require('discord.js');
require('dotenv').config();
const { commands } = require('./commands');

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('[Airpotscat] 전역 명령어 등록 시작...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // 전역 등록!
      { body: commands }
    );

    console.log('전역 명령어 등록 완료 (최대 1시간 소요)');
  } catch (error) {
    console.error('전역 명령어 등록 실패:', error);
  }
})();
