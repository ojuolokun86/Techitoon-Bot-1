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
                await sock.sendMessage(msg.key.remoteJid, { text: formatResponseWithHeaderFooter('📌 **Techitoon bot Commands:**\n\n✅ `.ping` - Check bot status 🟢\n✅ `.menu` - Show this menu ❓\n✅ `.joke` - Get a random joke 😂\n✅ `.quote` - Get an inspirational quote 💡\n✅ `.weather [city]` - Get weather info for a city 🌦️\n\n**Scheduling Commands:**\n⏰ `.schedule [time] [message]` - Schedule a message at a specific time 📅\n⏰ `.remind [time] [message]` - Set a reminder ⏲️\n❌ `.cancelschedule [message_id]` - Cancel a scheduled message 🔕\n❌ `.cancelreminder` - Cancel your active reminder 🔔\n\n**Polls & Voting:**\n📊 `.poll [question] [option1] [option2] ...` - Create a poll 📋\n✅ `.vote [option]` - Cast your vote 🗳️\n🏁 `.endpoll` - End the poll and show results\n\n**Events & Tournaments:**\n🏆 `.starttournament [name] [date]` - Start a tournament 🎮\n🏆 `.endtournament [name]` - End a tournament 🏁\n📅 `.tournamentstatus` - View current tournament status 🏅\n\n**Admin Commands:**\n🔐 `.clearwarns @user` - Clear warnings for a user 🧹\n📢 `.setannouncement [message]` - Set a custom announcement 📣\n🚫 `.warn @user [reason]` - Issue a warning ⚠️\n🚷 `.kick @user` - Kick a user from the group 🚪\n🚫 `.ban @user` - Ban a user from the group 🚫\n🔓 `.unban @user` - Unban a previously banned user 🔓\n\n**Group Commands:**\n🔹 `.tagall [message]` - Mention everyone in the group and send a message 📢\n🔹 `.mute` - Mute the group 🔇\n🔹 `.unmute` - Unmute the group 🔊\n🔹 `.announce [message]` - Start announcement (every 30 mins) 📣\n🔹 `.announce stop` - Stop announcement ❌\n🔹 `.lock` - Restrict chat to admins only 👑\n🔹 `.unlock` - Allow all members to chat 🗣️\n🔹 `.clear` - Clear the chat 🧹\n🔹 `.setgrouprules [rules]` - Set group rules 📜\n🔹 `.settournamentrules [rules]` - Set tournament rules 🏆\n🔹 `.setlanguage [language]` - Set bot language 🌐\n🔹 `.showstats` - Show group statistics 📊\n🔹 `.startwelcome` - Enable welcome messages 🎉\n🔹 `.stopwelcome` - Disable welcome messages ❌\n🔹 `.enable` - Enable the bot in this group ✅\n🔹 `.disable` - Disable the bot in this group ⛔\n\n━━━━━━━━━━━━━━━\n  🤖 𝙏𝙚𝙘𝙝𝙞𝙩𝙤𝙤𝙣 𝘼𝙄\n━━━━━━━━━━━━━━━') });
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