require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping test')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering commands...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('Commands registered.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`BOT READY: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  console.log('INTERACTION RECEIVED');

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    console.log('PING COMMAND USED');

    await interaction.reply({
      content: 'KARMAHQ ACTIVE',
      ephemeral: false
    });
  }
});

client.login(process.env.DISCORD_TOKEN);