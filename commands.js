const { SlashCommandBuilder } = require('discord.js');
const {
    setConfig, getConfig,
    addAdmin, getAdmins,
    excludeUser, getExcluded,
    resetGuildData
} = require('./db');

const commands = [
    new SlashCommandBuilder()
        .setName('참여일')
        .setDescription('비활성 기준일 설정')
        .addIntegerOption(opt =>
            opt.setName('일수').setDescription('기준일 수 (예: 60)').setRequired(true)),

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
        .setDescription('현재 서버 설정을 초기화합니다. (주의!)')
].map(cmd => cmd.toJSON());

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

        if (commandName === '참여일') {
            const days = interaction.options.getInteger('일수');
            await setConfig(guildId, 'inactive_days', days.toString());
            await interaction.reply(`비활성 기준일을 ${days}일로 설정했습니다.`);
        }

        else if (commandName === '관리자') {
            const user = interaction.options.getUser('유저');
            await addAdmin(guildId, user.id);
            await interaction.reply(`<@${user.id}> 를 알림 관리자에 등록했습니다.`);
        }

        else if (commandName === '관리자목록') {
            const ids = await getAdmins(guildId);
            const mentions = ids.map(id => `<@${id}>`).join(', ') || '없음';
            await interaction.reply(`📢 등록된 관리자:\n${mentions}`);
        }

        else if (commandName === '제외') {
            const user = interaction.options.getUser('유저');
            await excludeUser(guildId, user.id);
            await interaction.reply(`<@${user.id}> 는 비활성 감지 대상에서 제외되었습니다.`);
        }

        else if (commandName === '제외목록') {
            const ids = await getExcluded(guildId);
            const mentions = ids.map(id => `<@${id}>`).join(', ') || '없음';
            await interaction.reply(`🚫 제외된 유저 목록:\n${mentions}`);
        }

        else if (commandName === '상태확인') {
            const days = await getConfig(guildId, 'inactive_days');
            const admins = await getAdmins(guildId);
            const excluded = await getExcluded(guildId);

            const adminMentions = admins.map(id => `<@${id}>`).join(', ') || '없음';
            const excludedMentions = excluded.map(id => `<@${id}>`).join(', ') || '없음';

            await interaction.reply(
                `📋 **${interaction.guild.name} 서버 상태**\n` +
                `- 기준일: ${days || '설정되지 않음'}일\n` +
                `- 관리자: ${adminMentions}\n` +
                `- 제외 대상: ${excludedMentions}`
            );
        }

        else if (commandName === '초기화') {
            await resetGuildData(guildId);
            await interaction.reply('⚠️ 이 서버의 설정이 모두 초기화되었습니다.');
        }
    }
};
