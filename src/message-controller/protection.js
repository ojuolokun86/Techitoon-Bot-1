const { getGroupMetadata, deleteMessage, sendMessage, groupParticipantsUpdate } = require('@whiskeysockets/baileys');
const config = require('../config/config');
const { formatResponseWithHeaderFooter } = require('../utils/utils');
const warnings = {};  // Stores user warnings

// Strong anti-link regex
const LINK_REGEX = /(https?:\/\/\S+|www\.\S+|\S+\.(com|net|org|co|io|gg|xyz|ly|me|biz|info|shop|store|site|live|top|click|t.me))/;

// Sales-related keywords
const SALES_KEYWORDS = ["swap", "sale", "buy", "sell", "exchange", "sales", "price", "deal"];

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

// Handle anti-link protection
async function handleAntiLink(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        const participant = message.key.participant || chatId;  // Either the participant or the group chat ID
        const botNumber = "2348026977793@s.whatsapp.net";  // Your bot number

        // Check if the bot and user are admins
        const botAdmin = await isAdmin(sock, chatId, botNumber);
        const userAdmin = await isAdmin(sock, chatId, participant);

        if (!botAdmin) {
            console.log("❌ Bot is not an admin, cannot delete messages.");
            return;
        }

        // Check if the message contains a link
        const messageText = message.message.conversation || message.message.extendedTextMessage?.text || message.message.imageMessage?.caption || '';
        if (LINK_REGEX.test(messageText)) {
            if (userAdmin) {
                console.log(`✅ Admin ${participant} posted a link. No action taken.`);
                return;  // Allow admins to post links
            }

            // Delete the message and warn the user
            await sock.sendMessage(chatId, { delete: message.key });
            warnings[participant] = (warnings[participant] || 0) + 1;
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`⚠️ Warning ${warnings[participant]}/3: No links allowed, @${participant.split('@')[0]}!`) });

            // Remove user if they reach 3 warnings
            if (warnings[participant] >= 3) {
                await sock.groupParticipantsUpdate(chatId, [participant], 'remove');
            }
        }
    } catch (err) {
        console.error("Error handling anti-link:", err);
    }
}

// Check sales-related media
async function checkSalesMedia(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        const participant = message.key.participant || chatId;  // Either the participant or the group chat ID
        const botNumber = "2348026977793@s.whatsapp.net";  // Your bot number

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
            if (userAdmin) {
                console.log(`✅ Admin ${participant} posted sales-related content. No action taken.`);
                return;  // Allow admins to post sales stuff
            }

            // Delete the message and warn the user
            await sock.sendMessage(chatId, { delete: message.key });
            warnings[participant] = (warnings[participant] || 0) + 1;
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`⚠️ Warning ${warnings[participant]}/2: No sales or swap posts allowed, @${participant.split('@')[0]}.`) });

            // Remove user if they reach 2 warnings
            if (warnings[participant] >= 2) {
                await sock.groupParticipantsUpdate(chatId, [participant], 'remove');
            }
        }
    } catch (err) {
        console.error("Error checking sales media:", err);
    }
}

module.exports = { handleAntiLink, checkSalesMedia };