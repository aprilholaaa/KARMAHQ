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
const cheerio = require('cheerio');
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

  await interaction.deferReply();

  const targetUserId =
    interaction.customId.split('_')[1];

  const existingRows =
  await sheets.spreadsheets.values.get({

    spreadsheetId: SPREADSHEET_ID,

    range: 'Sheet1!A:AZ'
  });

const rows =
  existingRows.data.values || [];

let totalKarma = 0;

for (let i = 1; i < rows.length; i++) {

  const row = rows[i];

  if (
    String(row[3]).trim() ===
    String(targetUserId).trim()
  ) {

    totalKarma =
      Number(row[8]) || 0;

    break;
  }
}
  const member =
  await interaction.guild.members.fetch(
    targetUserId
  );

  const taskCategoryIds = [

'1481311691563073773',
'1484190792955461674',
'1484191986067181568',
'1490048135542865950',
'1490048221832282112',
'1490048289918161166'

];

let selectedCategory = null;

for (const categoryId of taskCategoryIds) {

  const channels =
    interaction.guild.channels.cache.filter(
      c =>
        c.parentId === categoryId &&
        c.type === ChannelType.GuildText
    );

  if (channels.size < 50) {

    selectedCategory = categoryId;
    break;
  }
}

if (!selectedCategory) {

  return interaction.editReply(

'❌ All task distribution categories are full.'

  );
}
  const taskChannel =
  await interaction.guild.channels.create({

    name:
     member.user.username,
    type: ChannelType.GuildText,

    parent:
      selectedCategory,

    permissionOverwrites: [

      {
        id:
          interaction.guild.id,

        deny:
          ['ViewChannel']
      },

      {
        id:
          member.id,

        allow: [
          'ViewChannel',
          'SendMessages',
          'ReadMessageHistory'
        ]
      }
    ]
  });

await taskChannel.send(

`<@${member.id}> you are verified.

<#1487433724344926419> is your communication channel with <@&1480907840398033026> and <@&1480909177961582662>.

Please read the following channels carefully to understand the workflow and rules:

<#1484427029901348964>

<#1484426857754660885>

<#1484442338590986281>`

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
try {

  await member.roles.remove(
    '1480908434365747343'
  );

} catch (error) {

  console.log(
    'NEW ROLE REMOVE FAILED'
  );

  console.error(error);
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

let existingRowIndex = -1;

for (let i = 1; i < rows.length; i++) {

  const row = rows[i];

  if (
  String(row[3]).trim() ===
  String(targetUserId).trim()
) {

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

await interaction.editReply(

`✅ Verification Successful

<@${targetUserId}> you are successfully verified.

Please continue here:
${taskChannel}

Thank you.`

);

setTimeout(async () => {

  await interaction.channel.delete();

}, 15000);

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

  if (
  String(row[3]).trim() ===
  String(targetUserId).trim()
) {

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

const member =
  await interaction.guild.members.fetch(
    targetUserId
  );

await member.kick(
  'Verification rejected'
);
  await interaction.reply(

`❌ Verification Failed

Moderation team rejected this verification request.

This ticket will now be closed automatically.`
  );

  setTimeout(async () => {

  await interaction.channel.delete();

}, 5000);

}
// ALT PASS
if (
  interaction.customId.startsWith(
    'altpass|'
  )
) {

  const parts =
  interaction.customId.split('|');
const discordId =
  parts[1];

const username =
  parts[2];

const postKarma =
  parts[3];

const commentKarma =
  parts[4];

const totalKarma =
  parts[5];

const karmaLevel =
  parts[6];

const ageText =
  parts[7];

const over18 =
  parts[8];

  const disabledButtons =
    new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId(
            interaction.customId
          )
          .setLabel('PASS')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

  await interaction.message.edit({
    components: [disabledButtons]
  });
  await sheets.spreadsheets.values.append({

  spreadsheetId: SPREADSHEET_ID,

  range: 'Sheet1!A:O',

  valueInputOption: 'USER_ENTERED',

  requestBody: {

    values: [[
      '',
      interaction.user.username,
      interaction.member.displayName || '',
      discordId,
      `https://reddit.com/u/${username}`,
      username,
      postKarma,
      commentKarma,
      totalKarma,
      karmaLevel,
      ageText,
      over18,
      'ALT',
      'APPROVED',
      ''
]]
  }
});

  return interaction.reply({

    content:

`✅ ALT VERIFIED

Reddit account approved:
${username}`

  });
}

// ALT FAIL
if (
  interaction.customId.startsWith(
    'altfail|'
  )
) {

  const parts =
  interaction.customId.split('|');
const discordId =
  parts[1];

const username =
  parts[2];

const postKarma =
  parts[3];

const commentKarma =
  parts[4];

const totalKarma =
  parts[5];

const karmaLevel =
  parts[6];

const ageText =
  parts[7];

const over18 =
  parts[8];

  const disabledButtons =
    new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId(
            interaction.customId
          )
          .setLabel('FAIL')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

  await interaction.message.edit({
    components: [disabledButtons]
  });
await sheets.spreadsheets.values.append({

  spreadsheetId: SPREADSHEET_ID,

  range: 'Sheet1!A:O',

  valueInputOption: 'USER_ENTERED',

  requestBody: {

    values: [[
      '',
      interaction.user.username,
      interaction.member.displayName || '',
      discordId,
      `https://reddit.com/u/${username}`,
      username,
      postKarma,
      commentKarma,
      totalKarma,
      karmaLevel,
      ageText,
      over18,
      'ALT',
      'REJECTED',
      ''
]]
  }
});
  return interaction.reply({

    content:

`❌ ALT REJECTED

Reddit account rejected:
${username}`

  });
}

} catch (error) {

  console.error(
    'BUTTON INTERACTION ERROR'
  );

  console.error(error);

  try {

  await interaction.editReply(
    '❌ Approval failed. Check Railway logs.'
  );

} catch {}
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
     const firstMember =
  channel.permissionOverwrites.cache.find(
    overwrite =>
      overwrite.type === 1
  );

if (firstMember) {

  await channel.setTopic(
    firstMember.id
  );
}
      // SEND INSTRUCTIONS
      await channel.send(

`📌 KARMAHQ VERIFICATION

Please send your Reddit profile link within 48 hours.

Example:
https://reddit.com/u/yourusername

If no response is received,
this ticket will be closed automatically.`

      );

      // START 48 hrs 1 MIN TIMER
      setTimeout(async () => {

        try {

          const messages =
            await channel.messages.fetch({
              limit: 20
            });

          const userResponded =
  messages.some(msg => {

    if (msg.author.bot) return false;

    const content =
      msg.content.toLowerCase().trim();

    const normalized =
      content
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/^reddit\.com\/(u|user)\//i, '')
        .replace(/^u\//i, '')
        .replace(/\//g, '')
        .trim();

    return normalized.length >= 3;
  });

          // NO RESPONSE
          if (!userResponded) {

            await channel.send(

`❌ Ticket Closed

No response was received from the user within the allowed verification time.

This ticket will now be closed automatically.`

            );

            const targetUserId =
  channel.topic;

if (targetUserId) {

  try {

    const member =
      await channel.guild.members.fetch(
        targetUserId
      );

    await member.kick(
      'Verification timeout'
    );

    console.log(
      `AUTO KICKED: ${member.user.tag}`
    );

  } catch (error) {

    console.log(
      'AUTO KICK FAILED'
    );

    console.error(error);
  }
}

await channel.delete();
          }
        
        } catch (error) {

          console.error(
            'TIMEOUT CHECK ERROR'
          );

          console.error(error);
        }

      }, 48 * 60 * 60 * 1000 + 60000);
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
    if (
  message.content.toLowerCase() ===
  '!verify'
) {
  const hasPermission =
  message.member.roles.cache.some(
    role =>
      role.name.toLowerCase().includes(
        'master'
      )
  );

if (!hasPermission) {

  return message.channel.send(

    '❌ You are not allowed to use !verify.'

  );
}
 await message.delete();

  const messages =
    await message.channel.messages.fetch({
      limit: 10
    });

  const redditMessage =
  [...messages.values()].find(
    msg =>
      !msg.author.bot &&
      msg.content.trim().length > 0
  );

if (!redditMessage) {

  return message.channel.send(

    '❌ No Reddit username found.'

  );
}

  await message.channel.send(

    '🔍 Verifying Reddit account...'

  );

  const content =
    redditMessage.content;
  const cleanContent =
  content
    .replace('www.', '')
    .toLowerCase();

let username = null;

if (
  cleanContent.includes('reddit.com/u/')
) {

  username = cleanContent
    .split('/u/')[1]
    ?.split('/')[0];

} else if (
  cleanContent.includes('reddit.com/user/')
) {

  username = cleanContent
    .split('/user/')[1]
    ?.split('/')[0];

} else if (
  cleanContent.toLowerCase().startsWith('u/')
) {

  username = cleanContent
    .split('u/')[1]
    ?.trim();

} else {

  username =
    cleanContent.trim();
}

if (!username) {

  return message.channel.send(
    '❌ Invalid Reddit username.'
  );
}
username =
  username
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^reddit\.com\/(u|user)\//i, '')
    .replace(/^u\//i, '')
    .replace(/\//g, '')
    .trim()
    .toLowerCase();
  const response =
    await axios.get(

      'https://real-time-reddit-scraper1.p.rapidapi.com/people_search',

      {
        params: {
          query: username
        },

        headers: {
          'x-rapidapi-key':
            process.env.RAPIDAPI_KEY,

          'x-rapidapi-host':
            'real-time-reddit-scraper1.p.rapidapi.com'
        }
      }
    );

  const users =
    response.data.data || [];
const existingRows =
  await sheets.spreadsheets.values.get({

    spreadsheetId: SPREADSHEET_ID,

    range: 'Sheet1!A:AZ'
  });

const rows =
  existingRows.data.values || [];

const cleanUsername =

String(username || '')
.replace(/https?:\/\/(www\.)?reddit\.com\/(u|user)\//gi, '')
.replace(/\//g, '')
.split('?')[0]
.trim()
.toLowerCase();

const redditExists =
  rows.some(row => {

    const sheetUsername =

String(row[5] || '')
.replace(/https?:\/\/(www\.)?reddit\.com\/(u|user)\//gi, '')
.replace(/\//g, '')
.split('?')[0]
.trim()
.toLowerCase();

    return sheetUsername === cleanUsername;
  });
if (redditExists) {

  return message.channel.send(

`❌ This Reddit account already exists in records.`

  );
}
  const exactUser =
    users.find(
      u =>

        u.name.toLowerCase() ===
        username.toLowerCase()
    );

  if (!exactUser) {

    return message.channel.send(

      '❌ Reddit user not found.'

    );
  }

  const totalKarma =
    exactUser.karma?.total || 0;
const postKarma =
  exactUser.karma?.post || 0;

const commentKarma =
  exactUser.karma?.comments || 0;

const data = {
  over_18:
    exactUser.profile.isNsfw
};

const createdDate =
  new Date(
    exactUser.profile.createdAt
  );

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
  const buttons =
  new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId(

`altpass|${message.author.id}|${username}|${postKarma}|${commentKarma}|${totalKarma}|${karmaLevel}|${ageText}|${data.over_18 ? 'YES' : 'NO'}`

)
        .setLabel('PASS')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(

`altfail|${message.author.id}|${username}|${postKarma}|${commentKarma}|${totalKarma}|${karmaLevel}|${ageText}|${data.over_18 ? 'YES' : 'NO'}`

)
        .setLabel('FAIL')
        .setStyle(ButtonStyle.Danger)
    );

await message.channel.send({

content:

`KARMAHQ ALT CHECK

Username: ${username}

Post Karma: ${postKarma}

Comment Karma: ${commentKarma}

Total Karma: ${totalKarma}

Karma Level: ${karmaLevel}

Account Age: ${ageText}

18+: ${data.over_18 ? 'YES' : 'NO'}

NSFW: ${data.over_18 ? 'YES' : 'NO'}

Status: ALT

Moderator review required.`,

components: [buttons]

});

  return;
}

    const channelName =
      message.channel.name.toLowerCase();

    if (
      !channelName.includes('get-verified')
    ) return;

    const content = message.content;
    const cleanContent =
  content
    .replace('www.', '')
    .toLowerCase();

await message.channel.send(
  '🔍 Verifying Reddit account...'
);

let username = null;

if (
  cleanContent.includes('reddit.com/u/')
) {

  username = cleanContent
    .split('/u/')[1]
    ?.split('/')[0];

} else if (
  cleanContent.includes('reddit.com/user/')
) {

  username = cleanContent
    .split('/user/')[1]
    ?.split('/')[0];

} else if (
  content.toLowerCase().startsWith('u/')
) {

  username = cleanContent
    .split('u/')[1]
    ?.trim();

} else {

  username = cleanContent.trim();
}

if (!username) {

  return message.channel.send(
    '❌ Invalid Reddit username.'
  );
}

username =
  username
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^reddit\.com\/(u|user)\//i, '')
    .replace(/^u\//i, '')
    .replace(/\//g, '')
    .trim()
    .toLowerCase();

if (!username.trim()) {
  return;
}
const response =
  await axios.get(

    'https://real-time-reddit-scraper1.p.rapidapi.com/people_search',

    {
      params: {
        query: username
      },

      headers: {
        'x-rapidapi-key':
          process.env.RAPIDAPI_KEY,

        'x-rapidapi-host':
          'real-time-reddit-scraper1.p.rapidapi.com'
      },

      timeout: 10000
    }
  );
const users =
  response.data.data || [];

const exactUser =
  users.find(
    u =>
      
u.name.toLowerCase() ===
username.toLowerCase()
  );

if (!exactUser) {

  return message.channel.send(
    '❌ Reddit user not found.'
  );
}

const totalKarma =
  exactUser.karma?.total || 0;
  const postKarma =
  exactUser.karma?.post || 0;

const commentKarma =
  exactUser.karma?.comments || 0;

const data = {
  over_18:
    exactUser.profile.isNsfw
};

const createdDate =
  new Date(
    exactUser.profile.createdAt
  );

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

const cleanUsername =

String(username || '')
.replace(/https?:\/\/(www\.)?reddit\.com\/(u|user)\//gi, '')
.replace(/\//g, '')
.split('?')[0]
.trim()
.toLowerCase();

const redditExists =
  rows.some(row => {

    const sheetUsername =

String(row[5] || '')
.replace(/https?:\/\/(www\.)?reddit\.com\/(u|user)\//gi, '')
.replace(/\//g, '')
.split('?')[0]
.trim()
.toLowerCase();

    return sheetUsername === cleanUsername;
  });

if (redditExists) {

  return message.channel.send(

`❌ This Reddit account already exists in records.`

  );
}

let existingRowIndex = -1;

for (let i = 1; i < rows.length; i++) {

  const row = rows[i];

  // DISCORD ID COLUMN = D
  if (
  String(row[3]).trim() ===
  String(message.author.id).trim()
) {

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
  '',
  '',
  totalKarma,
  karmaLevel,
  ageText,
  data.over_18 ? 'YES' : 'NO',
  'LIVE',
  verificationResult,
  ''
];

  console.log('SHEET WRITE START');

console.log(
  'USERNAME:',
  username
);

console.log(
  'DISCORD:',
  message.author.id
);

try {

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

console.log(
  'SHEET WRITE SUCCESS'
);

} catch (sheetError) {

  console.log(
    'SHEET WRITE FAILED'
  );

  console.error(sheetError);
}
    // PASS

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

Total Karma: ${totalKarma}

Karma Level: ${karmaLevel}

Account Age: ${ageText}

18+: ${data.over_18 ? 'YES' : 'NO'}

NSFW: ${data.over_18 ? 'YES' : 'NO'}

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

client.on(
  'guildMemberAdd',
  async member => {

    setTimeout(async () => {

      try {

        const refreshedMember =
          await member.guild.members.fetch(
            member.id
          );

        const hasNewRole =
          refreshedMember.roles.cache.has(
            '1480908434365747343'
          );

        const hasTasker =
          refreshedMember.roles.cache.has(
            '1480908809739305043'
          );

        if (
          hasNewRole &&
          !hasTasker
        ) {

          await refreshedMember.kick(
            'Inactive new user after 48 hours'
          );

          console.log(
            `AUTO KICKED: ${member.user.tag}`
          );
        }

      } catch (error) {

        console.log(
          'AUTO KICK ERROR'
        );

        console.error(error);
      }

    }, 48 * 60 * 60 * 1000 + 60000);
  }
);

client.login(process.env.DISCORD_TOKEN);

// redeploy trigger