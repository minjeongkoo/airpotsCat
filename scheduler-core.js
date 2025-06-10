module.exports = async function runScheduler(client, targetAdminId = null, isManual = false) {
  const {
    getAllGuildIds, getConfig, getAdmins, getExcluded, getAllVoiceLogs
  } = require('./db');

  const guildIds = await getAllGuildIds();
  const now = Date.now();

  for (const guildId of guildIds) {
    const threshold = parseInt(await getConfig(guildId, 'inactive_threshold')) || 60;
    const unit = await getConfig(guildId, 'inactive_unit') || 'days';
    const admins = await getAdmins(guildId);
    const excluded = new Set(await getExcluded(guildId));
    const voiceLogs = await getAllVoiceLogs(guildId);

    const thresholdMs = unit === 'days'
      ? threshold * 86400000
      : threshold * 3600000;

    const inactiveUsers = voiceLogs
      .filter(log =>
        !excluded.has(log.user_id) &&
        now - new Date(log.last_joined_at).getTime() > thresholdMs
      )
      .map(log => log.user_id);

    const guild = await client.guilds.fetch(guildId);
    const serverName = guild.name;

    const nowTime = new Date().toLocaleString('ko-KR', { 
      timeZone: 'Asia/Seoul',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // 보낼 관리자 목록 결정
    const notifyAdmins = targetAdminId ? [targetAdminId] : admins;

    if (inactiveUsers.length === 0) {
      const message = `${nowTime} 기준 **${serverName}** 서버에는 비활성 유저가 없어요 :D`;

      if (isManual && targetAdminId) {
        // 수동 호출일 때만 메시지 전송
        try {
          const admin = await client.users.fetch(targetAdminId);
          await admin.send(message);
        } catch (e) {
          console.warn(`[${guildId}] 관리자 DM 실패: ${targetAdminId}`, e.message);
        }
      } else {
        // 스케줄러 실행 시엔 콘솔 출력만
        console.log(`[${serverName}] 비활성 유저 없음 → DM 생략됨`);
      }

      continue;
    }

    // 비활성 유저가 있을 경우
    const mentions = inactiveUsers.map(uid => `<@${uid}>`).join(', ');
    const message =
      `📢 총 ${inactiveUsers.length}명의 유저가 ${threshold}${unit === 'days' ? '일' : '시간'}간 ` +
      `**${serverName}** 서버의 음성채널에 참여하지 않았습니다 x_x\n\n` +
      `${mentions}`;

    for (const adminId of notifyAdmins) {
      try {
        const admin = await client.users.fetch(adminId);
        await admin.send(message);
      } catch (e) {
        console.warn(`[${guildId}] 관리자 DM 실패: ${adminId}`, e.message);
      }
    }
  }
};
