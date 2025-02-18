const { formatResponse } = require('../utils/utils');

const helpText = `
📌 **Techitoon bot Commands:**

✅ \`.ping\` - Check bot status 🟢  
✅ \`.help\` - Show this help menu ❓  
✅ \`.joke\` - Get a random joke 😂  
✅ \`.quote\` - Get an inspirational quote 💡  
✅ \`.weather [city]\` - Get weather info for a city 🌦️  

**Scheduling Commands:**
⏰ \`.schedule [time] [message]\` - Schedule a message at a specific time 📅  
⏰ \`.remind [time] [message]\` - Set a reminder ⏲️  
❌ \`.cancelschedule [message_id]\` - Cancel a scheduled message 🔕  
❌ \`.cancelreminder\` - Cancel your active reminder 🔔

**Polls & Voting:**
📊 \`.poll [question] [option1] [option2] ...\` - Create a poll 📋  
✅ \`.vote [option]\` - Cast your vote 🗳️  
🏁 \`.endpoll\` - End the poll and show results

**Events & Tournaments:**
🏆 \`.starttournament [name] [date]\` - Start a tournament 🎮  
🏆 \`.endtournament [name]\` - End a tournament 🏁  
📅 \`.tournamentstatus\` - View current tournament status 🏅

**Admin Commands:**
🔐 \`.clearwarns @user\` - Clear warnings for a user 🧹  
📢 \`.setannouncement [message]\` - Set a custom announcement 📣  
🚫 \`.warn @user [reason]\` - Issue a warning ⚠️  
🚷 \`.kick @user\` - Kick a user from the group 🚪  
🚫 \`.ban @user\` - Ban a user from the group 🚫  
🔓 \`.unban @user\` - Unban a previously banned user 🔓

**Group Commands:**
🔹 \`.tagall [message]\` - Mention everyone in the group and send a message 📢  
🔹 \`.mute\` - Mute the group 🔇  
🔹 \`.unmute\` - Unmute the group 🔊  
🔹 \`.announce [message]\` - Start announcement (every 30 mins) 📣  
🔹 \`.announce stop\` - Stop announcement ❌  
🔹 \`.onlyadmin\` - Restrict chat to admins only 👑  
🔹 \`.notonlyadmin\` - Allow all members to chat 🗣️  
🔹 \`.clear\` - Clear the chat 🧹  
🔹 \`.setgrouprules [rules]\` - Set group rules 📜  
🔹 \`.settournamentrules [rules]\` - Set tournament rules 🏆  
🔹 \`.setlanguage [language]\` - Set bot language 🌐  
🔹 \`.showstats\` - Show group statistics 📊  
🔹 \`.startwelcome\` - Enable welcome messages 🎉  
🔹 \`.stopwelcome\` - Disable welcome messages ❌  
🔹 \`.enable\` - Enable the bot in this group ✅  
🔹 \`.disable\` - Disable the bot in this group ⛔  
`;

const sendHelpMenu = async (sock, chatId, isGroup, isAdmin) => {
    await sock.sendMessage(chatId, { text: formatResponse(helpText) });
};

const sendJoke = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponse('😂 Here is a joke for you!') });
};

const sendQuote = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponse('💬 Here is a quote for you!') });
};

const listAdmins = async (sock, chatId) => {
    const groupMetadata = await sock.groupMetadata(chatId);
    const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    const adminList = admins.map(admin => `- @${admin.id.split('@')[0]}`).join('\n');
    await sock.sendMessage(chatId, { text: formatResponse(`👮 *Group Admins*:\n${adminList}`), mentions: admins.map(admin => admin.id) });
};

const sendGroupInfo = async (sock, chatId) => {
    const groupMetadata = await sock.groupMetadata(chatId);
    const groupInfo = `
📄 *Group Info*:
- Name: ${groupMetadata.subject}
- Description: ${groupMetadata.desc}
- Created At: ${new Date(groupMetadata.creation * 1000).toLocaleString()}
- Participants: ${groupMetadata.participants.length}
    `;
    await sock.sendMessage(chatId, { text: formatResponse(groupInfo) });
};

const sendGroupRules = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponse('📜 Here are the group rules!') });
};

const showAllGroupStats = async (sock, chatId) => {
    await showGroupStats(sock, chatId);
};

module.exports = {
    sendHelpMenu,
    sendJoke,
    sendQuote,
    listAdmins,
    sendGroupInfo,
    sendGroupRules,
    showAllGroupStats,
};
