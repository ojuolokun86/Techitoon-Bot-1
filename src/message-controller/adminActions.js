const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');

const enableBot = async (sock, chatId, sender) => {
    try {
        const { data, error } = await supabase
            .from('group_settings')
            .upsert({ group_id: chatId, bot_enabled: true }, { onConflict: 'group_id' });

        if (error) {
            console.error('Error enabling bot:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error enabling bot.') });
            return;
        }

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Bot has been enabled in this group.') });
        console.log(`✅ Bot enabled in group: ${chatId}`);
    } catch (error) {
        console.error('Error enabling bot:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error enabling bot.') });
    }
};

const disableBot = async (sock, chatId, sender) => {
    try {
        const { data, error } = await supabase
            .from('group_settings')
            .upsert({ group_id: chatId, bot_enabled: false }, { onConflict: 'group_id' });

        if (error) {
            console.error('Error disabling bot:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error disabling bot.') });
            return;
        }

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Bot has been disabled in this group.') });
        console.log(`❌ Bot disabled in group: ${chatId}`);
    } catch (error) {
        console.error('Error disabling bot:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error disabling bot.') });
    }
};

const promoteUser = async (sock, chatId, message) => {
    const userId = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    try {
        await sock.groupParticipantsUpdate(chatId, [userId], 'promote');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`✅ User @${userId.split('@')[0]} has been promoted to admin.`), mentions: [userId] });
    } catch (error) {
        console.error('Error promoting user:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error promoting user.') });
    }
};

const demoteUser = async (sock, chatId, message) => {
    const userId = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    try {
        await sock.groupParticipantsUpdate(chatId, [userId], 'demote');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`❌ User @${userId.split('@')[0]} has been demoted from admin.`), mentions: [userId] });
    } catch (error) {
        console.error('Error demoting user:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error demoting user.') });
    }
};

module.exports = { enableBot, disableBot, promoteUser, demoteUser };