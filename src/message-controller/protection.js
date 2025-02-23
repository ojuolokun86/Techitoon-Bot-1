const { getGroupMetadata, deleteMessage, sendMessage, groupParticipantsUpdate } = require('@whiskeysockets/baileys');
const config = require('../config/config');
const { formatResponseWithHeaderFooter } = require('../utils/utils');
const warnings = {};  // Stores user warnings
const supabase = require('../supabaseClient');
const { warnUser } = require('./warning');

// Sales-related keywords
const SALES_KEYWORDS = [
    "sell", "selling", "for sale", "buy", "buying", "purchase", "price", "cost", "available for sale", "discount", "offer", "best price",
    "swap", "swapping", "exchange", "trading", "trade", "account swap", "account trade", "account exchange",
    "who wants to buy?", "i'm selling my account", "dm me to buy", "looking to sell", "account for sale", "who wants to swap?", "exchange offer", "willing to trade", "selling cheap"
];

// Link detection regex
const linkRegex = /((https?:\/\/|www\.)[^\s]+|chat\.whatsapp\.com\/[^\s]+|t\.me\/[^\s]+|bit\.ly\/[^\s]+|[\w-]+\.(com|net|org|info|biz|xyz|live|tv|me|link)(\/\S*)?)/gi;

function containsObfuscatedLink(message) {
    const obfuscatedPatterns = [
        /\bhttps?\s*:\s*\/\s*\/\b/i,  // h t t p : / /
        /\bwww\s*\.\s*\b/i,          // w w w .
        /\b[^\s]+\s*\[\s*dot\s*\]\s*[a-z]+\b/i,  // example [dot] com
        /\bhxxp/i,                   // hxxp instead of http
        /\bhttp?\s*[:\(\[]/i         // http( or http[
    ];

    return obfuscatedPatterns.some(pattern => pattern.test(message));
}

function shouldDeleteMessage(message) {
    return linkRegex.test(message) || containsObfuscatedLink(message);
}

// Check if the user is an admin
async function isAdmin(sock, chatId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        return groupMetadata.participants.some(p => p.id === userId && (p.admin === 'admin' || p.admin === 'superadmin'));
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// Function to check if a link is allowed
async function isAllowedLink(sock, text, sender, isAdmin) {
    const botNumber = config.botNumber; // Your bot number
    const ownerNumber = config.botOwnerId; // Your number

    // Check if the link is saved in Supabase
    const { data, error } = await supabase
        .from('links')
        .select('link')
        .eq('link', text)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error checking saved link:', error);
    }

    return data || isAdmin || sender === ownerNumber || sender === botNumber;
}

// Function to detect links
function containsLink(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    return urlRegex.test(text);
}

// Check for links in messages
async function checkForLinks(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        const participant = message.key.participant || chatId;  // Either the participant or the group chat ID
        const botNumber = config.botNumber;  // Your bot number

        // Skip link check for messages sent by the bot
        if (participant === botNumber) {
            return;
        }

        // Check if the bot and user are admins
        const botAdmin = await isAdmin(sock, chatId, botNumber);
        const userAdmin = await isAdmin(sock, chatId, participant);

        if (!botAdmin) {
            console.log("❌ Bot is not an admin, cannot delete messages.");
            return;
        }

        // Check if the message contains a link
        const msgText = message.message.conversation || message.message.extendedTextMessage?.text || message.message.imageMessage?.caption || '';
        if (shouldDeleteMessage(msgText)) {
            const isAllowed = await isAllowedLink(sock, msgText, participant, userAdmin);
            if (isAllowed) {
                console.log(`✅ Allowed link posted by ${participant}. No action taken.`);
                return;  // Allow saved links, admin links, and bot/owner links
            }

            // Delete the message and warn the user
            await sock.sendMessage(chatId, { delete: message.key });
            await warnUser(sock, chatId, participant, 'Shared a link');
        }
    } catch (err) {
        console.error("Error checking for links:", err);
    }
}

// Check sales-related media
async function checkSalesMedia(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        const participant = message.key.participant || chatId;  // Either the participant or the group chat ID
        const botNumber = config.botNumber;  // Your bot number

        // Check if the bot and user are admins
        const botAdmin = await isAdmin(sock, chatId, botNumber);
        const userAdmin = await isAdmin(sock, chatId, participant);

        if (!botAdmin) {
            console.log("❌ Bot is not an admin, cannot delete messages.");
            return;
        }

        // Check if the message contains sales-related keywords
        const caption = message.message.imageMessage?.caption?.toLowerCase() || '';
        if (SALES_KEYWORDS.some(word => caption.includes(word))) {
            if (userAdmin || participant === config.botOwnerId) {
                console.log(`✅ Admin or bot owner ${participant} posted sales-related content. No action taken.`);
                return;  // Allow admins and bot owner to post sales stuff
            }

            // Delete the message and warn the user
            await sock.sendMessage(chatId, { delete: message.key });
            await warnUser(sock, chatId, participant, 'Posted a sales or swap message');
        }
    } catch (err) {
        console.error("Error checking sales media:", err);
    }
}

// Check for account-related sales messages
async function checkAccountSales(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        const participant = message.key.participant || chatId;  // Either the participant or the group chat ID
        const botNumber = config.botNumber;  // Your bot number

        // Check if the bot and user are admins
        const botAdmin = await isAdmin(sock, chatId, botNumber);
        const userAdmin = await isAdmin(sock, chatId, participant);

        if (!botAdmin) {
            console.log("❌ Bot is not an admin, cannot delete messages.");
            return;
        }

        // Check if the message contains account-related sales keywords
        const msgText = message.message.conversation?.toLowerCase() || message.message.extendedTextMessage?.text?.toLowerCase() || message.message.imageMessage?.caption?.toLowerCase() || '';
        if (msgText.includes('account') && SALES_KEYWORDS.some(word => msgText.includes(word))) {
            if (userAdmin || participant === config.botOwnerId) {
                console.log(`✅ Admin or bot owner ${participant} posted account-related sales content. No action taken.`);
                return;  // Allow admins and bot owner to post account-related sales stuff
            }

            // Delete the message and warn the user
            await sock.sendMessage(chatId, { delete: message.key });
            await warnUser(sock, chatId, participant, 'Posted an account-related sales or swap message');
        }
    } catch (err) {
        console.error("Error checking account sales messages:", err);
    }
}

const handleIncomingMessages = async (sock, message) => {
    if (!message || !message.key || !message.message) {
        console.error('Invalid message object:', message);
        return;
    }

    const chatId = message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;
    const msgText = message.message.conversation || message.message.extendedTextMessage?.text || message.message.imageMessage?.caption || '';

    // Check for links, sales messages, or account-related sales messages
    if (containsLink(msgText)) {
        await checkForLinks(sock, message);
    } else if (SALES_KEYWORDS.some(word => msgText.toLowerCase().includes(word))) {
        await checkSalesMedia(sock, message);
    } else if (msgText.toLowerCase().includes('account')) {
        await checkAccountSales(sock, message);
    }
};

module.exports = { handleIncomingMessages };