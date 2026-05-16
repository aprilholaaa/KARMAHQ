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


const hasPermission =
  interaction.member.roles.cache.some(
    role =>
      role.name.toLowerCase().includes('master')
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
  interaction.customId.startsWith(
    'approve_'
  )
) {

  const targetUserId =
    interaction.customId.split('_')[1];

  const verificationData =
    verificationCache.get(
      targetUserId
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

if (
  member.roles.cache.has(
    '1504852274567053353'
  )
) {

  await member.roles.remove(
    '1504731672476909578'
  );
}

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
          .setCustomId(
            `approve_${targetUserId}`
          )
          .setLabel('Approved')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId(
            `reject_${targetUserId}`
          )
          .setLabel('Rejected')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
      );

  await interaction.message.edit({
    components: [disabledButtons]
  });

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

  if (row[3] === targetUserId) {

    existingRowIndex = i + 1;
    break;
  }
}

if (existingRowIndex !== -1) {

  await sheets.spreadsheets.values.update({

    spreadsheetId: SPREADSHEET_ID,

    range: `Sheet1!N${existingRowIndex}`,

    valueInputOption: 'USER_ENTERED',

    requestBody: {
      values: [['APPROVED']]
    }
  });
}

await interaction.reply(

 `✅ Verification Successful

<@${targetUserId}> you are successfully verified.

Your Reddit account has been approved by the moderation team.

Thank you.`

);

  setTimeout(async () => {

    await interaction.channel.delete();

  }, 120000);
}

// REJECT
if (
  interaction.customId.startsWith(
    'reject_'
  )
) {

  const targetUserId =
    interaction.customId.split('_')[1];

  const disabledButtons =
    new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId(
            `approve_${targetUserId}`
          )
          .setLabel('Approved')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId(
            `reject_${targetUserId}`
          )
          .setLabel('Rejected')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
      );

  await interaction.message.edit({
    components: [disabledButtons]
  });
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

  if (row[3] === targetUserId) {

    existingRowIndex = i + 1;
    break;
  }
}

if (existingRowIndex !== -1) {

  await sheets.spreadsheets.values.update({

    spreadsheetId: SPREADSHEET_ID,

    range: `Sheet1!N${existingRowIndex}`,

    valueInputOption: 'USER_ENTERED',

    requestBody: {
      values: [['REJECTED']]
    }
  });
}
  await interaction.reply(

`❌ Verification Failed

Moderation team rejected this verification request.

This ticket will now be closed automatically.`
  );

  setTimeout(async () => {

    await interaction.channel.delete();

  }, 120000);
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

            }, 120000);
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
  `https://www.reddit.com/user/${username}/about.json?raw_json=1`,
  {
    headers: {
      'User-Agent':
        'discord:karmahq:v1.0 (by /u/spez)'
    },

    timeout: 10000
  }
);

const data = response.data.data;

const postKarma =
  data.link_karma || 0;

const commentKarma =
  data.comment_karma || 0;

const totalKarma =
  postKarma + commentKarma;

const createdDate =
  new Date(data.created_utc * 1000);

const now = new Date();

const diffYears =
  now.getFullYear() -
  createdDate.getFullYear();

const ageText =
  `${diffYears} years`;

let karmaLevel = 'LOW';

if (totalKarma >= 1000) {

  karmaLevel = 'VERY HIGH';

} else if (totalKarma >= 500) {

  karmaLevel = 'HIGH';

} else if (totalKarma >= 200) {

  karmaLevel = 'MEDIUM';
}
let verificationResult =
  'PENDING REVIEW';
    
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
  '-',
  'LIVE',
  verificationResult,
  ''
];

console.log('SHEET WRITE START');

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
    verificationCache.set(
  message.author.id,
  {
    totalKarma,
    userId: message.author.id
  }
);

   const buttons =
  new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId(
          `approve_${message.author.id}`
        )
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(
          `reject_${message.author.id}`
        )
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

18+: ${data.over_18 ? 'YES' : 'NO'}

Status: LIVE

Verification: ${verificationResult}

⏳ Verification Pending Review

Your Reddit account statistics have been submitted successfully.

Please wait while the moderation team reviews your account.`,

  components: [buttons]

});
  } catch (error) {

  console.error(
    'MESSAGE VERIFY ERROR'
  );

  console.log(
    'STATUS:',
    error.response?.status
  );

  console.log(
    'DATA:',
    error.response?.data
  );

  console.log(
    'MESSAGE:',
    error.message
  );

  await message.channel.send(

`⚠️ Reddit verification failed.

Reddit temporarily blocked automated verification requests.

Please wait for moderator manual review.`

);

}
});

client.login(process.env.DISCORD_TOKEN);

// redeploy trigger