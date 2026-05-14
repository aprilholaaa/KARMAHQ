require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType
} = require('discord.js');

const axios = require('axios');
const { google } = require('googleapis');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({
  version: 'v4',
  auth
});

const SPREADSHEET_ID =
  '1XagI-OGeho9CXxlIakjtkR9tj0x0aURjiU953ESbv0Q';

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot status')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {

  try {

    console.log('Registering commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        '1479785889826734182'
      ),
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

// PING COMMAND
client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {

    return interaction.reply('KARMAHQ ACTIVE');
  }

});

// AUTO TICKET DETECTION
client.on('channelCreate', async channel => {

  try {

    if (channel.type !== ChannelType.GuildText) return;

    const channelName =
      channel.name.toLowerCase();

    // CHECK IF VERIFICATION TICKET
    if (
      channelName.includes('get-verified')
    ) {

      console.log(
        'VERIFICATION TICKET DETECTED'
      );

      // SEND INSTRUCTIONS
      await channel.send(

`📌 KARMAHQ VERIFICATION

Please send your Reddit profile link within 10 minutes.

Example:
https://reddit.com/u/yourusername

If no response is received,
this ticket will be closed automatically.`

      );

      // START 10 MIN TIMER
      setTimeout(async () => {

        try {

          const messages =
            await channel.messages.fetch({
              limit: 20
            });

          const userResponded =
            messages.some(msg =>
              msg.author.bot === false &&
              (
                msg.content.includes('reddit.com/u/') ||
                msg.content.includes('reddit.com/user/')
              )
            );

          // NO RESPONSE
          if (!userResponded) {

            await channel.send(

`❌ Ticket Closed

No response was received from the user within the allowed verification time.

This ticket will now be closed automatically.`

            );

            setTimeout(async () => {

              await channel.delete();

            }, 5000);
          }

        } catch (error) {

          console.error(
            'TIMEOUT CHECK ERROR'
          );

          console.error(error);
        }

      }, 10 * 60 * 1000);
    }

  } catch (error) {

    console.error(
      'CHANNEL CREATE ERROR'
    );

    console.error(error);
  }

});

// REDDIT LINK AUTO VERIFY
client.on('messageCreate', async message => {

  try {

    if (message.author.bot) return;

    const channelName =
      message.channel.name.toLowerCase();

    if (
      !channelName.includes('get-verified')
    ) return;

    const content = message.content;

    // CHECK FOR REDDIT LINK
    if (
      !content.includes('reddit.com/u/') &&
      !content.includes('reddit.com/user/')
    ) return;

    await message.channel.send(
      '🔍 Verifying Reddit account...'
    );

    let username = null;

    if (content.includes('/u/')) {

      username = content
        .split('/u/')[1]
        ?.split('/')[0];

    } else if (
      content.includes('/user/')
    ) {

      username = content
        .split('/user/')[1]
        ?.split('/')[0];
    }

    if (!username) {

      return message.channel.send(
        'Invalid Reddit profile link.'
      );
    }

    const response = await axios.get(
  `https://www.reddit.com/user/${username}/about.json`,
  {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36'
    }
  }
);

    const data = response.data.data;

    const postKarma =
      data.link_karma;

    const commentKarma =
      data.comment_karma;

    const totalKarma =
      postKarma + commentKarma;

    const nsfwStatus =
      data.subreddit?.over_18
        ? 'YES'
        : 'NO';

    const created = new Date(
      data.created_utc * 1000
    );

    const now = new Date();

    let years =
      now.getFullYear() -
      created.getFullYear();

    let months =
      now.getMonth() -
      created.getMonth();

    if (months < 0) {

      years--;
      months += 12;
    }

    let ageText = '';

    if (years > 0) {

      ageText +=
        `${years} year${years > 1 ? 's' : ''}`;
    }

    if (months > 0) {

      if (ageText.length > 0) {
        ageText += ' ';
      }

      ageText +=
        `${months} month${months > 1 ? 's' : ''}`;
    }

    if (ageText === '') {

      ageText = 'Less than 1 month';
    }

    let karmaLevel = 'LOWEST';

    if (totalKarma > 5000) {

      karmaLevel = 'VERY HIGH';

    } else if (totalKarma > 1000) {

      karmaLevel = 'HIGH';

    } else if (totalKarma > 200) {

      karmaLevel = 'MODERATE';

    } else if (totalKarma > 50) {

      karmaLevel = 'LOW';
    }

    let verificationResult = 'FAIL';

    if (
      karmaLevel === 'MODERATE' ||
      karmaLevel === 'HIGH' ||
      karmaLevel === 'VERY HIGH'
    ) {

      verificationResult = 'PASS';
    }

    // WRITE TO SHEET
    await sheets.spreadsheets.values.append({

      spreadsheetId: SPREADSHEET_ID,

      range: 'Sheet1!A:M',

      valueInputOption: 'USER_ENTERED',

      requestBody: {

        values: [[
          '',
          message.author.username,
          message.author.id,
          content,
          username,
          postKarma,
          commentKarma,
          totalKarma,
          karmaLevel,
          ageText,
          nsfwStatus,
          'ACTIVE',
          verificationResult
        ]]
      }
    });

    // PASS
    if (
      verificationResult === 'PASS'
    ) {

      await message.channel.send(

`KARMAHQ REPORT

Username: ${username}

Post Karma: ${postKarma}
Comment Karma: ${commentKarma}
Total Karma: ${totalKarma}

Karma Level: ${karmaLevel}

Account Age: ${ageText}

NSFW: ${nsfwStatus}

Status: ACTIVE

Verification: PASS

✅ Verification Successful

Your Reddit account has been verified successfully.

You meet our current requirements.

Our team will assign tasks to you soon.

Thank you.`

      );

    }

    // FAIL
    else {

      await message.channel.send(

`KARMAHQ REPORT

Username: ${username}

Post Karma: ${postKarma}
Comment Karma: ${commentKarma}
Total Karma: ${totalKarma}

Karma Level: ${karmaLevel}

Account Age: ${ageText}

NSFW: ${nsfwStatus}

Status: ACTIVE

Verification: FAIL

❌ Verification Failed

Your Reddit account does not meet our minimum requirements.

Reason:
Low / Lowest Karma Account

This ticket will now be closed automatically.

Thank you.`

      );

      setTimeout(async () => {

        await message.channel.delete();

      }, 5000);
    }

  } catch (error) {

    console.error(
      'MESSAGE VERIFY ERROR'
    );

    console.error(
      error.response?.data ||
      error.message ||
      error
    );

    await message.channel.send(

`Failed to fetch Reddit account.

Account may be suspended,
deleted, or invalid.`

    );
  }

});

client.login(process.env.DISCORD_TOKEN);