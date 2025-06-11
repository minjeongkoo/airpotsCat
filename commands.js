// commands.js
const { SlashCommandBuilder } = require('discord.js');
const runScheduler = require('./scheduler-core');
const { getAllVoiceLogs } = require('./db');

const {
    setConfig,
    getConfig,
    addAdmin,
    getAdmins,
    excludeUser,
    getExcluded,
    resetGuildData,
    removeAdmin,
    removeExcludedUser
} = require('./db');

const commands = [
    new SlashCommandBuilder()
        .setName('참여기준')
        .setDescription('비활성 기준 설정 (일 또는 시간)')
        .addIntegerOption(opt =>
            opt.setName('수치').setDescription('기준 수치 (예: 10)').setRequired(true))
        .addStringOption(opt =>
            opt.setName('단위')
                .setDescription('기준 단위')
                .setRequired(true)
                .addChoices(
                    { name: '일', value: 'days' },
                    { name: '시간', value: 'hours' }
                )),

    new SlashCommandBuilder()
        .setName('알림필요')
        .setDescription('알림 받을분 등록')
        .addUserOption(opt =>
            opt.setName('유저').setDescription('(관리자 권한을 가진 유저여야 합니다)').setRequired(true)),

    new SlashCommandBuilder()
        .setName('알림이용중')
        .setDescription('등록된 알림 수신자 목록 보기'),

    new SlashCommandBuilder()
        .setName('제외')
        .setDescription('비활성 유저로 감지되지 않도록 제외 등록')
        .addUserOption(opt =>
            opt.setName('유저').setDescription('제외할 유저').setRequired(true)),

    new SlashCommandBuilder()
        .setName('제외목록')
        .setDescription('제외된 유저 목록 보기'),

    new SlashCommandBuilder()
        .setName('status')
        .setDescription('현재 서버 설정 상태를 확인합니다.'),

    new SlashCommandBuilder()
        .setName('reset_server')
        .setDescription('현재 서버 설정을 초기화합니다. (주의!)'),

    new SlashCommandBuilder()
        .setName('확인')
        .setDescription('(수동) 비활성 유저를 검사하고 알림 수신자에게 알림을 보냅니다.'),

    new SlashCommandBuilder()
        .setName('voice_chat_logs')
        .setDescription('서버 멤버들의 마지막 음성채널 참여 기록이 보여집니다.'),

    new SlashCommandBuilder()
        .setName('제외삭제')
        .setDescription('제외 목록에서 유저를 제거')
        .addUserOption(opt =>
            opt.setName('유저').setDescription('제외 해제할 유저').setRequired(true)),

    new SlashCommandBuilder()
        .setName('알림제거')
        .setDescription('알림 이용자 제거')
        .addUserOption(opt =>
            opt.setName('유저').setDescription('알림을 그만 받을 유저의 이름').setRequired(true)),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('기본 설정 및 사용법을 안내합니다.')


].map(cmd => cmd.toJSON());

function formatDateKorean(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    let relative = '';
    if (diffMin < 1) relative = '방금 전';
    else if (diffMin < 60) relative = `${diffMin}분 전`;
    else if (diffHr < 24) relative = `${diffHr}시간 전`;
    else relative = `${diffDay}일 전`;

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}년 ${mm}월 ${dd}일 ${hh}시 ${min}분 (${relative})`;
}


module.exports = {
    commands,
    async execute(interaction, client) {
        const { commandName, guildId } = interaction;

        const isAdmin = interaction.memberPermissions?.has('Administrator');
        if (!isAdmin) {
            return await interaction.reply({
                content: '이 명령어는 관리자만 사용할 수 있습니다',
                flags: 64
            });
        }

        if (!interaction.guild) {
            return await interaction.reply({
                content: '죄송합니다. 해당 서버 정보가 유효하지 않습니다. 봇 관리자에게 문의 바랍니다. rekenzo#3030',
                flags: 64
            });
        }

        if (commandName === 'help') {
            await interaction.reply({
                content: `1️⃣ **/reset-server** \n
- 서버 데이터를 초기화합니다.
- 봇 사용 전에 반드시 한 번 실행하세요.
\n
2️⃣ **/status** \n
- 현재 유저의 음성 채널 참여 기록을 확인합니다.  
- 초기화 직후엔 '없음'으로 표시됩니다.
\n
3️⃣ **/참여기준 [수치] [단위]** \n
- 비활성 유저로 간주할 기준을 설정합니다.  
- 예: \`/참여기준 10 일\` → 10일 이상 미참여 시 비활성 처리
\n
4️⃣ **/알림필요 @user** \n
- 비활성 유저 알림을 받을 관리자를 등록합니다.  
- 알림은 매일 **오후 10시**에 DM으로 발송됩니다.
\n
5️⃣ **/제외 @user** \n
- 특정 유저를 비활성 유저 대상에서 제외합니다.  
- 예: 봇 계정, 관리자 계정 등
\n
ℹ️ 추가 문의는 개발자에게!
- rekenzo#3030
    `,
                flags: 64,
            });
        }

        else if (commandName === '참여기준') {
            const value = interaction.options.getInteger('수치');
            const unit = interaction.options.getString('단위');

            await setConfig(guildId, 'inactive_threshold', value.toString());
            await setConfig(guildId, 'inactive_unit', unit); // 'days' 또는 'hours'

            await interaction.reply({
                content: `비활성 기준을 ${value}${unit === 'days' ? '일' : '시간'}로 설정했습니다.`,
                flags: 64,
            });
        }

        else if (commandName === '알림필요') {
            const user = interaction.options.getUser('유저');
            await addAdmin(guildId, user.id);
            await interaction.reply({
                content: `<@${user.id}>를 알림 받으실 분으로 등록했습니다.`,
                flags: 64,
            });
        }

        else if (commandName === '알림이용중') {
            const ids = await getAdmins(guildId);
            const mentions = ids.map(id => `<@${id}>`).join(', ') || '없음';
            await interaction.reply({
                content: `알림 이용중: \n${mentions}`,
                flags: 64
            });
        }

        else if (commandName === '제외') {
            const user = interaction.options.getUser('유저');
            await excludeUser(guildId, user.id);
            await interaction.reply({
                content: `제외 목록에 등록 완료 : @${user.displayName}`,
                flags: 64
            });
        }

        else if (commandName === '제외목록') {
            const ids = await getExcluded(guildId);
            const mentions = ids.map(id => `<@${id}>`).join(', ') || '없음';
            await interaction.reply({
                content: `제외된 유저 목록:\n${mentions}`,
                flags: 64
            });
        }

        else if (commandName === 'status') {
            const threshold = await getConfig(guildId, 'inactive_threshold');
            const unit = await getConfig(guildId, 'inactive_unit');
            const admins = await getAdmins(guildId);
            const excluded = await getExcluded(guildId);

            const adminMentions = admins.map(id => `<@${id}>`).join(', ') || '없음';
            const excludedMentions = excluded.map(id => `<@${id}>`).join(', ') || '없음';

            await interaction.reply({
                content:
                    `**${interaction.guild.name} 서버 상태** <:AirpotCat_pink:1382184614910623855>\n` +
                    `- 기준: ${threshold || '설정되지 않음'} ${unit === 'hours' ? '시간' : '일'}\n` +
                    `- 관리자: ${adminMentions}\n` +
                    `- 제외 대상: ${excludedMentions}`,
                flags: 64,
            });
        }

        else if (commandName === 'reset_server') {
            await resetGuildData(guildId);

            const guild = await interaction.client.guilds.fetch(guildId);
            await guild.members.fetch(); // 멤버 캐시 필수
            const { initGuildInDatabase } = require('./db');
            initGuildInDatabase(guild); // voice_logs에 전체 멤버 등록

            await interaction.reply({
                content: `⚠️ ${interaction.guild.name} 서버의 설정이 모두 초기화되었습니다.\n**서버 상태**\n + 모든 유저의 마지막 참여 시각을 현재 시간으로 초기 등록했습니다.`,
                flags: 64,
            });
        }

        else if (commandName === '확인') {
            await interaction.reply({
                content: `🔍 비활성 유저를 검사 중입니다...`,
                flags: 64,
            });
            await runScheduler(client, interaction.user.id, true);
            await interaction.followUp({
                content: `완료되었습니다! DM으로 보내드렸어요.`,
                flags: 64,
            });
        }

        else if (commandName === 'voice_chat_logs') {
            const guild = await interaction.guild.fetch();
            const members = await guild.members.fetch();
            const logs = await getAllVoiceLogs(guildId);
            const logMap = new Map(logs.map(log => [log.user_id, log.last_joined_at]));

            const rows = [...members.values()]
                .filter(member => !member.user.bot)
                .map(member => {
                    const name = member.displayName.padEnd(20, ' ');
                    const last = logMap.get(member.id);
                    const formattedDate = last ? formatDateKorean(last) : '없음';
                    return `${name} | ${formattedDate}`;
                });

            const header = `## ${guild.name} 서버 음성 채널 참여 로그`;
            const body = rows.map(row => {
                const [name, last] = row.split('|').map(s => s.trim());
                return `- ${name}: ${last}`;
            }).join('\n');

            await interaction.reply({
                content: `${header}\n${body}`,
                flags: 64
            });
        }

        else if (commandName === '제외삭제') {
            const user = interaction.options.getUser('유저');
            await removeExcludedUser(guildId, user.id);
            await interaction.reply({
                content: `<@${user.id}> 이제 다시 비활성 감지 대상이 됩니다.`,
                flags: 64,
            });
        }

        else if (commandName === '알림제거') {
            const user = interaction.options.getUser('유저');
            await removeAdmin(guildId, user.id);
            await interaction.reply({
                content: `이제 <@${user.id}> 님은 알림을 수신하지 않습니다.`,
                ephemeral: true,
            });
        }
    }
};
