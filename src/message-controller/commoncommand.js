const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');

const sendGroupRules = async (sock, chatId) => {
    const { data, error } = await supabase
        .from('group_settings')
        .select('group_rules')
        .eq('group_id', chatId)
        .single();

    if (error || !data.group_rules) {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('No group rules set.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`📜 *Group Rules*:\n${data.group_rules}`) });
    }
};

const listAdmins = async (sock, chatId) => {
    const groupMetadata = await sock.groupMetadata(chatId);
    const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    const adminList = admins.map(admin => `@${admin.id.split('@')[0]}`).join('\n');
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`👑 *Group Admins*:\n${adminList}`), mentions: admins.map(admin => admin.id) });
};

const sendGroupInfo = async (sock, chatId) => {
    const groupMetadata = await sock.groupMetadata(chatId);
    const groupInfo = `
📋 *Group Info*:
- Name: ${groupMetadata.subject}
- Description: ${groupMetadata.desc}
- Created At: ${new Date(groupMetadata.creation * 1000).toLocaleString()}
- Total Members: ${groupMetadata.participants.length}
    `;
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(groupInfo) });
};

const sendHelpMenu = async (sock, chatId, isGroup, isAdmin) => {
    const helpText = `
📜✨ 𝙏𝙚𝙘𝙝𝙞𝙩𝙤𝙤𝙣 𝘽𝙤𝙩 𝙈𝙚𝙣𝙪 ✨📜
🔹 Your friendly AI assistant, here to serve! 🤖

💡 General Commands:
📍 .ping – Am I alive? Let’s find out! ⚡
📍 .menu – Shows this awesome menu! 📜
📍 .joke – Need a laugh? I got you! 😂
📍 .quote – Get inspired with a random quote! ✨
📍 .weather <city> – Check the skies before you step out! ☁️🌦️
📍 .translate <text> – Lost in translation? I’ll help! 🈶➡️🇬🇧

👑 Admin Commands (Boss Mode Activated!)
🛠️ .admin – See who’s running the show! 🏆
📊 .info – Get group details in one click! 🕵️‍♂️
📜 .rules – Read the sacred laws of the group! 📖
🧹 .clear – Wipe the chat clean! 🚮 (Admin Only)
🚫 .ban @user – Send someone to exile! 👋 (Admin Only)
🎤 .tagall – Summon all group members! 🏟️ (Admin Only)
🔇 .mute – Silence! Only admins can speak! 🤫 (Admin Only)
🔊 .unmute – Let the people speak again! 🎙️ (Admin Only)
📢 .announce <message> – Make a grand announcement! 📡 (Admin Only)
🚫 .stopannounce – End announcement mode! ❌ (Admin Only)

📅 Scheduling & Reminders:
⏳ .schedule <message> – Set a future message! ⏰ (Admin Only)
🔔 .remind <message> – Never forget important stuff! 📝 (Admin Only)
❌ .cancelschedule – Abort mission! Stop scheduled messages! 🚀 (Admin Only)
❌ .cancelreminder – Forget the reminder! 🚫 (Admin Only)

📊 Polls & Tournaments:
📊 .poll <question> – Let democracy decide! 🗳️ (Admin Only)
🗳️ .vote <option> – Cast your vote like a good citizen! ✅
🏁 .endpoll – Wrap up the poll and declare the winner! 🎉 (Admin Only)
⚽ .starttournament – Let the games begin! 🏆 (Admin Only)
🏁 .endtournament – Close the tournament! 🏅 (Admin Only)
📢 .tournamentstatus – Check who’s winning! 📊

⚙️ Group & Bot Settings:
📝 .setgrouprules <rules> – Set the laws of the land! 📜 (Admin Only)
📜 .settournamentrules <rules> – Define tournament rules! ⚽ (Admin Only)
🈯 .setlanguage <language> – Change the bot’s language! 🌍 (Admin Only)
📊 .showstats – Who’s been the most active? 📈 (Admin Only)
❌ .delete – Erase unwanted messages! 🔥 (Admin Only)
🚀 .enable – Power up the bot! ⚡
🛑 .disable – Shut me down… but why? 😢
🎉 .startwelcome – Activate welcome messages! 🎊 (Admin Only)
🚫 .stopwelcome – No more welcome hugs! 🙅‍♂️ (Admin Only)

⚠️ Warnings & Moderation:
🚨 .warn @user <reason> – Issue a formal warning! ⚠️ (Admin Only)
📜 .listwarn – Check the troublemakers! 👀 (Admin Only)
❌ .resetwarn @user – Forgive and forget! ✝️ (Admin Only)

🛠 Custom Commands & Links:
🆕 .addcommand <accessLevel> <command> <response> – Create custom commands! 🛠️ (Admin Only)
❌ .deletecommand <command> – Remove custom commands! 🗑️ (Admin Only)
🔗 .savelink <title> <link> – Save important links! 📌 (Admin Only)
📤 .sharelink <title> – Share saved links! 🔗
🗑️ .deletelink <title> – Remove saved links! 🚮 (Admin Only)
🛑 .stoplink – Stop reposting the shared link! 🚫

💡 Use commands wisely! Or the bot might just develop a mind of its own… 🤖💀

🚀 𝙏𝙚𝙘𝙝𝙞𝙩𝙤𝙤𝙣 - Making WhatsApp Chats Smarter! 🚀
    `;
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(helpText) });
};

const enableBot = async (sock, chatId) => {
    const { error } = await supabase
        .from('group_settings')
        .upsert({ group_id: chatId, bot_enabled: true }, { onConflict: 'group_id' });

    if (error) {
        console.error('Error enabling bot:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('Unable to enable the bot. Please try again later.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Bot has been enabled in this group.') });
    }
};

const disableBot = async (sock, chatId) => {
    const { error } = await supabase
        .from('group_settings')
        .upsert({ group_id: chatId, bot_enabled: false }, { onConflict: 'group_id' });

    if (error) {
        console.error('Error disabling bot:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('Unable to disable the bot. Please try again later.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('🛑 Bot has been disabled in this group.') });
    }
};

module.exports = {
    sendGroupRules,
    listAdmins,
    sendGroupInfo,
    sendHelpMenu,
    enableBot,
    disableBot,
};