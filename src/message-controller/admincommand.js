const config = require('../config/config');
const { formatResponse } = require('../utils/utils');

const scheduledMessages = [];

const scheduleMessage = async (sock, chatId, args) => {
    await sock.sendMessage(chatId, { text: formatResponse('📅 Message scheduled.') });
};

const clearChat = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponse('🧹 Chat cleared by admin.') });
};

const tagAll = async (sock, chatId, message, sender) => {
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants.map(p => p.id);
    const mentions = participants.map(id => ({ id }));

    let text = `╔══════════════════╗\n║ 🚀 *TECHITOON BOT* 🚀 ║\n╚══════════════════╝\n\n`;
    text += `📌 *Group:* 『 ${groupMetadata.subject} 』\n`;
    text += `👤 *User:* 『 @${sender.split('@')[0]} 』\n`;
    text += `📝 *Message:* 『 ${message} 』\n\n`;
    text += `╭━ ⋅☆⋅ ━╮\n  🤖 *Techitoon AI*\n╰━ ⋅☆⋅ ━╯\n\n`;

    participants.forEach(participant => {
        text += `🎊 @${participant.split('@')[0]}\n`;
    });

    await sock.sendMessage(chatId, { text: formatResponse(text), mentions });
};

const startAnnouncement = async (sock, chatId, message) => {
    await sock.sendMessage(chatId, { text: formatResponse(`📢 Announcement started: ${message}`) });
};

const stopAnnouncement = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponse('📢 Announcement stopped.') });
};

const listScheduledMessages = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponse('📅 Listing scheduled messages.') });
};

const pinMessage = async (sock, chatId, args) => {
    await sock.sendMessage(chatId, { text: formatResponse('📌 Message pinned.') });
};

const unpinMessage = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponse('📌 Message unpinned.') });
};

const setGroupRules = async (sock, chatId, rules) => {
    await sock.sendMessage(chatId, { text: formatResponse(`📜 Group rules set: ${rules}`) });
};

const setTournamentRules = async (sock, chatId, rules) => {
    await sock.sendMessage(chatId, { text: formatResponse(`📜 Tournament rules set: ${rules}`) });
};

const setLanguage = async (sock, chatId, args) => {
    await sock.sendMessage(chatId, { text: formatResponse('🌐 Language set.') });
};

const banUser = async (sock, chatId, args) => {
    if (args.length > 0) {
        const userToBan = args[0].replace('@', '') + "@s.whatsapp.net";
        await sock.groupParticipantsUpdate(chatId, [userToBan], 'remove');
        await sock.sendMessage(chatId, { text: formatResponse(`🚫 User ${args[0]} has been banned.`) });
    } else {
        await sock.sendMessage(chatId, { text: formatResponse('Usage: .ban @user') });
    }
};

const deleteMessage = async (sock, chatId, msg) => {
    if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo) {
        const messageId = msg.message.extendedTextMessage.contextInfo.stanzaId;
        await sock.sendMessage(chatId, { delete: { id: messageId, remoteJid: chatId, fromMe: false } });
    }
};

const startWelcome = async (sock, chatId) => {
    config.botSettings.welcomeMessagesEnabled = true;
    await sock.sendMessage(chatId, { text: formatResponse('👋 Welcome messages enabled.') });
};

const stopWelcome = async (sock, chatId) => {
    config.botSettings.welcomeMessagesEnabled = false;
    await sock.sendMessage(chatId, { text: formatResponse('👋 Welcome messages disabled.') });
};

const detectAndDeleteSpam = async (sock, chatId, msg) => {
    const msgText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const spamKeywords = ['sale', 'sell', 'exchange', 'dm for price'];
    const containsSpam = spamKeywords.some(keyword => msgText.toLowerCase().includes(keyword));

    const isMedia = msg.message.imageMessage || msg.message.videoMessage || msg.message.documentMessage || msg.message.audioMessage;

    const sender = msg.key.participant || msg.key.remoteJid;
    const groupMetadata = await sock.groupMetadata(chatId);
    const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

    if (containsSpam && isMedia && !isAdmin && sender !== config.botOwnerId) {
        await deleteMessage(sock, chatId, msg);

        if (!config.warnings[sender]) {
            config.warnings[sender] = 0;
        }
        config.warnings[sender] += 1;

        const remainingWarnings = config.botSettings.maxWarnings - config.warnings[sender];

        if (config.warnings[sender] >= config.botSettings.maxWarnings) {
            await sock.groupParticipantsUpdate(chatId, [sender], 'remove');
            await sock.sendMessage(chatId, { text: formatResponse(`🚫 User @${sender.split('@')[0]} has been kicked for repeated spam.`), mentions: [sender] });
        } else {
            await sock.sendMessage(chatId, { text: formatResponse(`⚠️ **Warning**: Only admins are allowed to post sales or exchange content. Please refrain from posting sales-related content in the group or you will be removed after ${remainingWarnings} more warning(s).`), mentions: [sender] });
        }
    }
};

const detectAndDeleteLinks = async (sock, chatId, msg) => {
    const msgText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const containsLink = /https?:\/\/|www\./i.test(msgText);

    const sender = msg.key.participant || msg.key.remoteJid;
    const groupMetadata = await sock.groupMetadata(chatId);
    const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

    if (containsLink && !isAdmin && sender !== config.botOwnerId) {
        await deleteMessage(sock, chatId, msg);

        if (!config.warnings[sender]) {
            config.warnings[sender] = 0;
        }
        config.warnings[sender] += 1;

        const remainingWarnings = config.botSettings.maxWarnings - config.warnings[sender];

        if (config.warnings[sender] >= config.botSettings.maxWarnings) {
            await sock.groupParticipantsUpdate(chatId, [sender], 'remove');
            await sock.sendMessage(chatId, { text: formatResponse(`🚫 User @${sender.split('@')[0]} has been kicked for repeated link sharing.`), mentions: [sender] });
        } else {
            await sock.sendMessage(chatId, { text: formatResponse(`⚠️ **Warning**: You have posted a link, which is not allowed. Please refrain from posting links in the group or you will be removed after ${remainingWarnings} more warning(s).`), mentions: [sender] });
        }
    }
};

module.exports = {
    clearChat,
    tagAll,
    startAnnouncement,
    stopAnnouncement,
    scheduleMessage,
    listScheduledMessages,
    pinMessage,
    unpinMessage,
    setGroupRules,
    setTournamentRules,
    setLanguage,
    banUser,
    deleteMessage,
    startWelcome,
    stopWelcome,
    detectAndDeleteSpam,
    detectAndDeleteLinks,
};