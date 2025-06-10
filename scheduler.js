// scheduler.js
const cron = require('node-cron');
const {
  getConfig,
  getVoiceLogs,
  getAdmins,
  getExcluded
} = require('./db');

function calculateDaysAgo(dateString) {
  const lastDate = new Date(dateString);
  const now = new Date();
  const diffTime = now - lastDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = function scheduleCheck(client) {
  cron.schedule('0 10 * * *', () => {  // 매일 오전 10시
    console.log('⏰ 비활성 유저 검사 시작');

    getConfig('inactive_days', (err, value) => {
      const inactiveDays = parseInt(value || '60', 10);

      getVoiceLogs((err, logs) => {
        getAdmins((err, admins) => {
          getExcluded((err, excluded) => {
            logs.forEach(user => {
              if (excluded.includes(user.user_id)) return;

              const daysAgo = calculateDaysAgo(user.last_join);
              if (daysAgo >= inactiveDays) {
                admins.forEach(async adminId => {
                  try {
                    const admin = await client.users.fetch(adminId);
                    const guild = client.guilds.cache.first();  // 단일 서버 기준
                    const message = `📢 <@${user.user_id}> 님은 ${guild.name} 서버에서 음성채널에 ${daysAgo}일간 참여하지 않았습니다 x_x`;
                    admin.send(message);
                  } catch (err) {
                    console.error(`❌ 관리자 ${adminId} DM 전송 실패`, err);
                  }
                });
              }
            });
          });
        });
      });
    });
  });
};
