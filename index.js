require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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
const verificationCache =
  new Map();

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
client.on('interactionCreate', async interaction => {

  try {

    if (!interaction.isButton()) return;

    const allowedRoles = [
      '1504584640634163331',
      '1504584604135456929'
    ];

    const memberRoles =
      interaction.member.roles.cache;

    const hasPermission =
      allowedRoles.some(roleId =>
        memberRoles.has(roleId)
      );

    if (!hasPermission) {

      return interaction.reply({
        content:
          '❌ You are not allowed to use moderation controls.',
        ephemeral: true
      });
    }

    // APPROVE
    if (
      interaction.customId ===
      'approve_verification'
    ) {
      const verificationData =
  verificationCache.get(
    interaction.user.id
  );

if (!verificationData) {

  return interaction.reply({
    content:
      '❌ Verification data expired.',
    ephemeral: true
  });
}

const totalKarma =
  verificationData.totalKarma;
      const member =
  await interaction.guild.members.fetch(
    verificationData.userId
  );

// TASKER
await member.roles.add(
  '1480908809739305043'
);

// >200
if (totalKarma >= 200) {

  await member.roles.add(
    '1504544473936560239'
  );
}

// >500
if (totalKarma >= 500) {

  await member.roles.add(
    '1504544632732782613'
  );
}

// >1K
if (totalKarma >= 1000) {

  await member.roles.add(
    '1504544695370514552'
  );
}

// >2K
if (totalKarma >= 2000) {

  await member.roles.add(
    '1504544785610833980'
  );
}

// >5K
if (totalKarma >= 5000) {

  await member.roles.add(
    '1504544612726079669'
  );
}
const disabledButtons =
  new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId('approve_verification')
        .setLabel('Approved')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId('reject_verification')
        .setLabel('Rejected')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

await interaction.message.edit({
  components: [disabledButtons]
});

await interaction.reply(

`✅ Verification Successful

Your Reddit account has been verified successfully.

Moderation team approved your verification.

Thank you.`
);

      setTimeout(async () => {

        await interaction.channel.delete();

      }, 5000);
    }

    // REJECT
    if (
      interaction.customId ===
      'reject_verification'
    ) {
const disabledButtons =
  new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId('approve_verification')
        .setLabel('Approved')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId('reject_verification')
        .setLabel('Rejected')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

await interaction.message.edit({
  components: [disabledButtons]
});
      await interaction.reply(

`❌ Verification Failed

Moderation team rejected this verification request.

This ticket will now be closed automatically.`
      );

      setTimeout(async () => {

        await interaction.channel.delete();

      }, 5000);
    }

  } catch (error) {

    console.error(
      'BUTTON INTERACTION ERROR'
    );

    console.error(error);
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

let verificationResult = 'PENDING REVIEW';
    
    const existingRows =
  await sheets.spreadsheets.values.get({

    spreadsheetId: SPREADSHEET_ID,

    range: 'Sheet1!A:AZ'
  });

const rows =
  existingRows.data.values || [];

let existingRowIndex = -1;

for (let i = 1; i < rows.length; i++) {

  const row = rows[i];

  // DISCORD ID COLUMN = D
  if (row[3] === message.author.id) {

    existingRowIndex = i + 1;
    break;
  }
}

const rowData = [
  '',
  message.author.username,
  message.member?.displayName || '',
  message.author.id,
  content,
  username,
  postKarma,
  commentKarma,
  totalKarma,
  karmaLevel,
  ageText,
  nsfwStatus,
  'LIVE',
  verificationResult,
  ''
];

if (existingRowIndex === -1) {

  await sheets.spreadsheets.values.append({

    spreadsheetId: SPREADSHEET_ID,

    range: 'Sheet1!A:O',

    valueInputOption: 'USER_ENTERED',

    requestBody: {
      values: [rowData]
    }
  });

} else {

  await sheets.spreadsheets.values.update({

    spreadsheetId: SPREADSHEET_ID,

    range: `Sheet1!A${existingRowIndex}:O${existingRowIndex}`,

    valueInputOption: 'USER_ENTERED',

    requestBody: {
      values: [rowData]
    }
  });
}
    // PASS
    verificationverificationCache.set(
  message.author.id,
  {
    totalKarma,
    userId: message.author.id
  }
);
   Cache.set(
  message.author.id,
  {
    totalKarma
  }
);
   const buttons =
  new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId('approve_verification')
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('reject_verification')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    );

await message.channel.send({

  content:

`KARMAHQ REPORT

Username: ${username}

Post Karma: ${postKarma}
Comment Karma: ${commentKarma}
Total Karma: ${totalKarma}

Karma Level: ${karmaLevel}

Account Age: ${ageText}

18+: ${nsfwStatus}

Status: LIVE

Verification: PENDING REVIEW

⏳ Verification Pending Review

Your Reddit account statistics have been submitted successfully.

Please wait while the moderation team reviews your account.`,

  components: [buttons]

});

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