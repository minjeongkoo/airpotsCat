const { SlashCommandBuilder } = require('discord.js');
const runScheduler = require('./scheduler-core');
const { getAllVoiceLogs } = require('./db');

const {
    setConfig, getConfig,
    addAdmin, getAdmins,
    excludeUser, getExcluded,
    resetGuildData
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
        .setName('관리자')
        .setDescription('알림 받을 관리자 등록')
        .addUserOption(opt =>
            opt.setName('유저').setDescription('등록할 관리자').setRequired(true)),

    new SlashCommandBuilder()
        .setName('관리자목록')
        .setDescription('등록된 관리자 목록 보기'),

    new SlashCommandBuilder()
        .setName('제외')
        .setDescription('비활성 유저로 감지되지 않도록 제외 등록')
        .addUserOption(opt =>
            opt.setName('유저').setDescription('제외할 유저').setRequired(true)),

    new SlashCommandBuilder()
        .setName('제외목록')
        .setDescription('제외된 유저 목록 보기'),

    new SlashCommandBuilder()
        .setName('상태확인')
        .setDescription('현재 서버 설정 상태를 확인합니다.'),

    new SlashCommandBuilder()
        .setName('초기화')
        .setDescription('현재 서버 설정을 초기화합니다. (주의!)'),

    new SlashCommandBuilder()
        .setName('비활성확인')
        .setDescription('지금 즉시 비활성 유저를 검사하고 관리자에게 알림을 보냅니다.'),

    new SlashCommandBuilder()
        .setName('상세로그')
        .setDescription('서버 멤버의 마지막 음성채널 참여 기록을 확인합니다.'),

    new SlashCommandBuilder()
        .setName('제외삭제')
        .setDescription('제외 목록에서 유저를 제거')
        .addUserOption(opt =>
            opt.setName('유저').setDescription('제외 해제할 유저').setRequired(true)),


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
    async execute(interaction) {
        const { commandName, guildId } = interaction;

        const isAdmin = interaction.memberPermissions?.has('Administrator');
        if (!isAdmin) {
            return await interaction.reply({
                content: '이 명령어는 관리자만 사용할 수 있습니다',
                ephemeral: true
            });
        }

        if (!interaction.guild) {
            return await interaction.reply({
                content: '죄송합니다. 해당 서버 정보가 유효하지 않습니다. 봇 관리자에게 문의 바랍니다. rekenzo#3030',
                ephemeral: true
            });
        }


        if (commandName === '참여기준') {
            const value = interaction.options.getInteger('수치');
            const unit = interaction.options.getString('단위');

            await setConfig(guildId, 'inactive_threshold', value.toString());
            await setConfig(guildId, 'inactive_unit', unit); // 'days' 또는 'hours'

            await interaction.reply(`비활성 기준을 ${value}${unit === 'days' ? '일' : '시간'}로 설정했습니다.`);
        }

        else if (commandName === '관리자') {
            const user = interaction.options.getUser('유저');
            await addAdmin(guildId, user.id);
            await interaction.reply(`<@${user.id}> 를 알림 관리자에 등록했습니다.`);
        }

        else if (commandName === '관리자목록') {
            const ids = await getAdmins(guildId);
            const mentions = ids.map(id => `<@${id}>`).join(', ') || '없음';
            await interaction.reply(`등록된 관리자:\n${mentions}`);
        }

        else if (commandName === '제외') {
            const user = interaction.options.getUser('유저');
            await excludeUser(guildId, user.id);
            await interaction.reply(`<@${user.id}> 는 비활성 감지 대상에서 제외되었습니다.`);
        }

        else if (commandName === '제외목록') {
            const ids = await getExcluded(guildId);
            const mentions = ids.map(id => `<@${id}>`).join(', ') || '없음';
            await interaction.reply(`제외된 유저 목록:\n${mentions}`);
        }

        else if (commandName === '상태확인') {
            const threshold = await getConfig(guildId, 'inactive_threshold');
            const unit = await getConfig(guildId, 'inactive_unit');
            const admins = await getAdmins(guildId);
            const excluded = await getExcluded(guildId);

            const adminMentions = admins.map(id => `<@${id}>`).join(', ') || '없음';
            const excludedMentions = excluded.map(id => `<@${id}>`).join(', ') || '없음';

            await interaction.reply(
                `**${interaction.guild.name} 서버 상태**\n` +
                `- 기준: ${threshold || '설정되지 않음'} ${unit === 'hours' ? '시간' : '일'}\n` +
                `- 관리자: ${adminMentions}\n` +
                `- 제외 대상: ${excludedMentions}`
            );
        }

        else if (commandName === '초기화') {
            await resetGuildData(guildId);

            const guild = await interaction.client.guilds.fetch(guildId);
            await guild.members.fetch(); // 멤버 캐시 필수
            const { initGuildInDatabase } = require('./db');
            initGuildInDatabase(guild); // voice_logs에 전체 멤버 등록

            await interaction.reply('⚠️ 이 서버의 설정이 모두 초기화되었습니다.\n모든 유저의 마지막 참여 시각을 현재 시간으로 초기 등록했습니다.');
        }

        else if (commandName === '비활성확인') {
            await interaction.reply('🔍 비활성 유저를 검사 중입니다...');
            await runScheduler(client, interaction.user.id, true);
            await interaction.followUp('✅ 완료되었습니다! 관리자에게 알림을 보냈습니다.');
        }

        else if (commandName === '상세로그') {
            const guild = await interaction.guild.fetch();
            const members = await guild.members.fetch();
            const logs = await getAllVoiceLogs(guildId); // { user_id, last_joined_at }[]
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

            await interaction.reply({ content: `${header}\n${body}`, ephemeral: true });
        }

        else if (commandName === '제외삭제') {
            const user = interaction.options.getUser('유저');
            await removeExcludedUser(guildId, user.id);
            await interaction.reply(`<@${user.id}> 는 이제 다시 비활성 감지 대상이 됩니다.`);
        }
    }
};
