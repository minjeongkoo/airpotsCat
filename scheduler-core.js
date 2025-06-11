const {
  getAllGuildIds,
  getConfig,
  getAdmins,
  getExcluded,
  getAllVoiceLogs
} = require('./db');

// 스케줄러 실행 함수
module.exports = async function runScheduler(client, targetAdminId = null, isManual = false) {
  const guildIds = await getAllGuildIds(); // 모든 서버 ID 조회
  const now = Date.now(); // 현재 시간(ms)

  for (const guildId of guildIds) {
    // 설정값 조회
    const threshold = parseInt(await getConfig(guildId, 'inactive_threshold')) || 60;
    const unit = await getConfig(guildId, 'inactive_unit') || 'days';
    const admins = await getAdmins(guildId);
    const excluded = new Set(await getExcluded(guildId));
    const voiceLogs = await getAllVoiceLogs(guildId);

    // 비활성 기준 시간 계산
    const thresholdMs = unit === 'days'
      ? threshold * 86400000
      : threshold * 3600000;

    // 비활성 유저 필터링
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

    // 알림을 보낼 관리자 목록 결정
    const notifyAdmins = targetAdminId ? [targetAdminId] : admins;

    // 비활성 유저가 없을 경우
    if (inactiveUsers.length === 0) {
      const message = `**${serverName}** 서버에는 비활성 유저가 없어요 (${nowTime} 기준)`;

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
        console.info(`[${serverName}] 비활성 유저 없음. DM 생략됨.`);
      }

      continue;
    }

    // 비활성 유저가 있을 경우
    const mentions = inactiveUsers.map(uid => `<@${uid}>`).join(', ');
    const message =
      `총 ${inactiveUsers.length}명의 유저가 ${threshold}${unit === 'days' ? '일' : '시간'}동안 ` +
      `**${serverName}** 서버의 음성채널에 참여하지 않았습니다.\n\n${mentions}\n\n` + 
      `> 필요에 따라서 /제외 명령어로 해당 유저를 비활성 유저로 지정하지 않을 수 있어요!\n` +
      `> 비활성 기준 날짜를 조정: /참여기준`;

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
