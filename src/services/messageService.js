const axios = require('axios');
const translate = require('@vitalets/google-translate-api');
const config = require('../config/config');
const { isLink, isSalesRelated, welcomeMessage, formatResponseWithHeaderFooter, showGroupStats } = require('../utils/utils');

const handleWeatherCommand = async (sock, msg, args) => {
    const city = args.join(' ');
    const apiKey = config.apiKeys.weatherApiKey;
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        const weatherInfo = `Weather in ${data.name}: ${data.weather[0].description}, Temperature: ${data.main.temp}°C`;
        await sock.sendMessage(msg.key.remoteJid, { text: formatResponseWithHeaderFooter(weatherInfo) });
    } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, { text: formatResponseWithHeaderFooter('Unable to get weather information. Please try again later.') });
    }
};

const handleTranslateCommand = async (sock, msg, args) => {
    const text = args.join(' ');
    try {
        const res = await translate(text, { to: 'en' });
        await sock.sendMessage(msg.key.remoteJid, { text: formatResponseWithHeaderFooter(res.text) });
    } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, { text: formatResponseWithHeaderFooter('Unable to translate text. Please try again later.') });
    }
};

const handleIncomingMessages = async (sock, m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const chat = await sock.groupMetadata(msg.key.remoteJid);
    const contact = msg.key.participant || msg.key.remoteJid;

    // Log input
    console.log(`Received message from ${contact}: ${msg.message.conversation}`);

    // Check if the bot is enabled in this group
    if (!config.enabledGroups.includes(chat.id)) return;

    // Check if the bot is an admin in the group
    const botParticipant = chat.participants.find(participant => participant.id === sock.user.id);
    if (!botParticipant || !botParticipant.isAdmin) return;

    // Handle commands
    if (msg.message.conversation.startsWith(config.botSettings.commandPrefix)) {
        const command = msg.message.conversation.slice(1).split(' ')[0];
        const args = msg.message.conversation.slice(1).split(' ').slice(1);

        switch (command) {
            case 'weather':
                await handleWeatherCommand(sock, msg, args);
                break;
            case 'translate':
                await handleTranslateCommand(sock, msg, args);
                break;
            case 'menu':
                await sock.sendMessage(msg.key.remoteJid, { text: formatResponseWithHeaderFooter(`
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
🚀 .enable – Power up the bot! ⚡ (Admin Only)
🛑 .disable – Shut me down… but why? 😢 (Admin Only)
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
📤 .sharelink <title> – Share saved links! 🔗 (Admin Only)
🗑️ .deletelink <title> – Remove saved links! 🚮 (Admin Only)

💡 Use commands wisely! Or the bot might just develop a mind of its own… 🤖💀

🚀 𝙏𝙚𝙘𝙝𝙞𝙩𝙤𝙤𝙣 - Making WhatsApp Chats Smarter! 🚀
                `) });
                break;
            case 'showstats':
                await showGroupStats(sock, msg.key.remoteJid);
                break;
            // Add other commands here
        }
    }
};

const handleGroupParticipantsUpdate = async (sock, update) => {
    const chat = await sock.groupMetadata(update.id);
    const contact = update.participants[0];
    const user = contact.split('@')[0];
    if (update.action === 'add') {
        await sock.sendMessage(chat.id, { text: formatResponseWithHeaderFooter(welcomeMessage(user)) });
        console.log(`Sent welcome message to ${user}`);
    }
};

module.exports = {
    handleIncomingMessages,
    handleGroupParticipantsUpdate
};