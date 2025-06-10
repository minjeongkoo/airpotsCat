// index.js
const { Client, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();
const commandModule = require('./commands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await commandModule.execute(interaction);
});

client.login(process.env.BOT_TOKEN);
