require('dotenv').config();

const config = {
    botOwnerId: process.env.ADMIN_NUMBER,
    adminNumber: "2348026977793@s.whatsapp.net", // Replace with your actual number
    apiKeys: {
        weatherApiKey: process.env.WEATHER_API_KEY,
        translationApiKey: process.env.TRANSLATION_API_KEY,
    },
    botSettings: {
        commandPrefix: process.env.PREFIX || '.',  // Ensure this is correctly set
        responseDelay: 1000, // Delay in milliseconds for bot responses
        maxWarnings: 2, // Maximum number of warnings before kicking the user
        enabled: false, // Bot starts in disabled mode
        welcomeMessagesEnabled: false, // Welcome messages start off
        groupStatus: {}, // Track bot enabled status for each group
        groupWelcomeStatus: {} // Track welcome message status for each group
    },
    database: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
    },
    enabledGroups: [], // List of groups where the bot is enabled
    warnings: {}, // Track warnings for users
    savedLinks: [], // Store saved links
    groupRules: {}, // Store group rules
};

module.exports = config;