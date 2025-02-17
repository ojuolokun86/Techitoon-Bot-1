const axios = require('axios');
const translate = require('@vitalets/google-translate-api');
const config = require('../config/config');
const { isLink, isSalesRelated, welcomeMessage } = require('../utils/utils');

const handleWeatherCommand = async (sock, msg, args) => {
    const city = args.join(' ');
    const apiKey = config.apiKeys.weatherApiKey;
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        const weatherInfo = `Weather in ${data.name}: ${data.weather[0].description}, Temperature: ${data.main.temp}°C`;
        await sock.sendMessage(msg.key.remoteJid, { text: weatherInfo });
    } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, { text: 'Unable to get weather information. Please try again later.' });
    }
};

const handleTranslateCommand = async (sock, msg, args) => {
    const text = args.join(' ');
    try {
        const res = await translate(text, { to: 'en' });
        await sock.sendMessage(msg.key.remoteJid, { text: res.text });
    } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, { text: 'Unable to translate text. Please try again later.' });
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

        if (command === 'weather') {
            await handleWeatherCommand(sock, msg, args);
        } else if (command === 'translate') {
            await handleTranslateCommand(sock, msg, args);
        }
    }
};

const handleGroupParticipantsUpdate = async (sock, update) => {
    const chat = await sock.groupMetadata(update.id);
    const contact = update.participants[0];
    const user = contact.split('@')[0];
    if (update.action === 'add') {
        await sock.sendMessage(chat.id, { text: welcomeMessage(user) });
        console.log(`Sent welcome message to ${user}`);
    }
};

module.exports = {
    handleIncomingMessages,
    handleGroupParticipantsUpdate
};