const config = require('../config/config');
const { formatResponseWithHeaderFooter, welcomeMessage } = require('../utils/utils');
const supabase = require('../supabaseClient');

const scheduledMessages = [];
const announcementIntervals = {};

const clearChat = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('🧹 Chat cleared by admin.') });
};

const tagAll = async (sock, chatId, message, sender) => {
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants.map(p => p.id);
    const mentions = participants.map(id => ({ id }));

    let text = `📌 *Group:* 『 ${groupMetadata.subject} 』\n`;
    text += `👤 *User:* 『 @${sender.split('@')[0]} 』\n`;
    text += `📝 *Message:* 『 ${message} 』\n\n`;

    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(text), mentions });
};

const startAnnouncement = async (sock, chatId, message) => {
    try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`📢 Announcement:\n\n${message}`) });
    } catch (error) {
        console.error('Error starting announcement:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not start announcement mode.') });
    }
};

const stopAnnouncement = async (sock, chatId) => {
    try {
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('🔊 Group is now open for everyone.') });
    } catch (error) {
        console.error('Error stopping announcement:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not stop announcement mode.') });
    }
};

const scheduleMessage = async (sock, chatId, args) => {
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('📅 Message scheduled.') });
};

const listScheduledMessages = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('📅 Listing scheduled messages.') });
};

const pinMessage = async (sock, chatId, args) => {
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('📌 Message pinned.') });
};

const unpinMessage = async (sock, chatId) => {
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('📌 Message unpinned.') });
};

const setGroupRules = async (sock, chatId, rules) => {
    const { data, error } = await supabase
        .from('group_settings')
        .upsert({ group_id: chatId, group_rules: rules }, { onConflict: 'group_id' });

    if (error) {
        console.error('Error setting group rules:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not set group rules.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`📜 Group rules set: ${rules}`) });
    }
};

const setTournamentRules = async (sock, chatId, rules) => {
    const { data, error } = await supabase
        .from('group_settings')
        .upsert({ group_id: chatId, tournament_rules: rules }, { onConflict: 'group_id' });

    if (error) {
        console.error('Error setting tournament rules:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not set tournament rules.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`📜 Tournament rules set: ${rules}`) });
    }
};

const setLanguage = async (sock, chatId, language) => {
    const { data, error } = await supabase
        .from('group_settings')
        .upsert({ group_id: chatId, language }, { onConflict: 'group_id' });

    if (error) {
        console.error('Error setting language:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not set language.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🌐 Language set to: ${language}`) });
    }
};

const banUser = async (sock, chatId, args) => {
    if (args.length > 0) {
        const userToBan = args[0].replace('@', '') + "@s.whatsapp.net";
        await sock.groupParticipantsUpdate(chatId, [userToBan], 'remove');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🚫 User ${args[0]} has been banned.`) });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('Usage: .ban @user') });
    }
};

const deleteMessage = async (sock, chatId, msg) => {
    if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo) {
        const messageId = msg.message.extendedTextMessage.contextInfo.stanzaId;
        await sock.sendMessage(chatId, { delete: { id: messageId, remoteJid: chatId, fromMe: false } });
    }
};

const startWelcome = async (sock, chatId) => {
    const { data, error } = await supabase
        .from('group_settings')
        .upsert({ group_id: chatId, welcome_messages_enabled: true }, { onConflict: 'group_id' });

    if (error) {
        console.error('Error enabling welcome messages:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not enable welcome messages.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Welcome messages have been enabled for this group.') });
    }
};

const stopWelcome = async (sock, chatId) => {
    const { data, error } = await supabase
        .from('group_settings')
        .upsert({ group_id: chatId, welcome_messages_enabled: false }, { onConflict: 'group_id' });

    if (error) {
        console.error('Error disabling welcome messages:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not disable welcome messages.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Welcome messages have been disabled for this group.') });
    }
};

async function enableBot(sock, chatId, sender) {
    const { error } = await supabase
        .from('group_settings')
        .upsert({ group_id: chatId, bot_enabled: true });

    if (error) {
        console.error('Error enabling bot:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("❌ Error enabling bot.") });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("✅ Bot enabled.") });
    }
}

async function disableBot(sock, chatId, sender) {
    const { error } = await supabase
        .from('group_settings')
        .upsert({ group_id: chatId, bot_enabled: false });

    if (error) {
        console.error('Error disabling bot:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("❌ Error disabling bot.") });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("✅ Bot disabled.") });
    }
}

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
    enableBot,
    disableBot,
};