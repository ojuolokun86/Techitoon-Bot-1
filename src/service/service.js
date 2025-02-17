// This file handles interactions with external services, such as fetching weather information, translating text, and managing data storage with Supabase.

const fetch = require('node-fetch');
const supabase = require('@supabase/supabase-js');

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function fetchWeather(location) {
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=YOUR_WEATHER_API_KEY&q=${location}`);
    const data = await response.json();
    return data;
}

async function translateText(text, targetLanguage) {
    const response = await fetch(`https://api.translationapi.com/translate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer YOUR_TRANSLATION_API_KEY`
        },
        body: JSON.stringify({ text, target: targetLanguage })
    });
    const data = await response.json();
    return data.translatedText;
}

async function saveDataToSupabase(table, data) {
    const { data: result, error } = await supabaseClient
        .from(table)
        .insert(data);
    if (error) throw error;
    return result;
}

module.exports = {
    fetchWeather,
    translateText,
    saveDataToSupabase
};