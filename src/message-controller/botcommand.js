const axios = require('axios');
const translate = require('@vitalets/google-translate-api');
const config = require('../config/config');
const { formatResponse } = require('../utils/utils');

const handleWeatherCommand = async (sock, message, args) => {
    const chatId = message.key.remoteJid;
    const city = args.join(' ');
    if (!city) {
        await sock.sendMessage(chatId, { text: formatResponse('Please provide a city name.') });
        return;
    }

    // Fetch weather data from API (example)
    const weatherData = await fetchWeatherData(city);
    if (weatherData) {
        const weatherText = `
🌤️ *Weather in ${city}*:
- Temperature: ${weatherData.temp}°C
- Condition: ${weatherData.condition}
        `;
        await sock.sendMessage(chatId, { text: formatResponse(weatherText) });
    } else {
        await sock.sendMessage(chatId, { text: formatResponse('Unable to fetch weather data. Please try again later.') });
    }
};

const handleTranslateCommand = async (sock, message, args) => {
    const chatId = message.key.remoteJid;
    const textToTranslate = args.join(' ');
    if (!textToTranslate) {
        await sock.sendMessage(chatId, { text: formatResponse('Please provide text to translate.') });
        return;
    }

    // Translate text using API (example)
    const translatedText = await translateText(textToTranslate);
    if (translatedText) {
        await sock.sendMessage(chatId, { text: formatResponse(`🔤 *Translated Text*:\n${translatedText}`) });
    } else {
        await sock.sendMessage(chatId, { text: formatResponse('Unable to translate text. Please try again later.') });
    }
};

const enableBot = async (sock, chatId) => {
    if (!config.enabledGroups.includes(chatId)) {
        config.enabledGroups.push(chatId);
        await sock.sendMessage(chatId, { text: '✅ Bot enabled in this group.' });
    } else {
        await sock.sendMessage(chatId, { text: '⚠️ Bot is already enabled in this group.' });
    }
};

const disableBot = async (sock, chatId) => {
    const index = config.enabledGroups.indexOf(chatId);
    if (index > -1) {
        config.enabledGroups.splice(index, 1);
        await sock.sendMessage(chatId, { text: '❌ Bot disabled in this group.' });
    } else {
        await sock.sendMessage(chatId, { text: '⚠️ Bot is not enabled in this group.' });
    }
};

module.exports = {
    handleWeatherCommand,
    handleTranslateCommand,
    enableBot,
    disableBot,
};