const axios = require('axios');
const translate = require('@vitalets/google-translate-api');
const config = require('../config/config');
const { formatResponseWithHeaderFooter } = require('../utils/utils');

const handleWeatherCommand = async (sock, message, args) => {
    const chatId = message.key.remoteJid;
    const city = args.join(' ');
    if (!city) {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('Please provide a city name.') });
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
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(weatherText) });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('Unable to fetch weather data. Please try again later.') });
    }
};

const handleTranslateCommand = async (sock, message, args) => {
    const chatId = message.key.remoteJid;
    const textToTranslate = args.join(' ');
    if (!textToTranslate) {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('Please provide text to translate.') });
        return;
    }

    // Translate text using API (example)
    const translatedText = await translateText(textToTranslate);
    if (translatedText) {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🔤 *Translated Text*:\n${translatedText}`) });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('Unable to translate text. Please try again later.') });
    }
};

const enableBot = async (sock, chatId) => {
    if (!config.enabledGroups.includes(chatId)) {
        config.enabledGroups.push(chatId);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Bot enabled in this group.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Bot is already enabled in this group.') });
    }
};

const disableBot = async (sock, chatId) => {
    const index = config.enabledGroups.indexOf(chatId);
    if (index > -1) {
        config.enabledGroups.splice(index, 1);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Bot disabled in this group.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Bot is not enabled in this group.') });
    }
};

module.exports = {
    handleWeatherCommand,
    handleTranslateCommand,
    enableBot,
    disableBot,
};