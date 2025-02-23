const config = require('../config/config');
const { formatResponseWithHeaderFooter } = require('../utils/utils');
const supabase = require('../supabaseClient');

const warnUser = async (sock, chatId, userId, reason) => {
    try {
        const { data, error } = await supabase
            .from('warnings')
            .insert([{ group_id: chatId, user_id: userId, reason }]);

        if (error) {
            console.error('Error warning user:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error warning user.') });
            return;
        }

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`⚠️ User @${userId.split('@')[0]} has been warned. Reason: ${reason}`), mentions: [userId] });
        console.log(`⚠️ User ${userId} warned in group: ${chatId}`);
    } catch (error) {
        console.error('Error warning user:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error warning user.') });
    }
};

const listWarnings = async (sock, chatId) => {
    try {
        const { data, error } = await supabase
            .from('warnings')
            .select('*')
            .eq('group_id', chatId);

        if (error) {
            console.error('Error listing warnings:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error listing warnings.') });
            return;
        }

        if (data.length === 0) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('No warnings found in this group.') });
            return;
        }

        let warningList = '⚠️ *Warnings in this group:* ⚠️\n\n';
        data.forEach((warning, index) => {
            warningList += `${index + 1}. @${warning.user_id.split('@')[0]} - ${warning.reason}\n`;
        });

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(warningList), mentions: data.map(w => w.user_id) });
    } catch (error) {
        console.error('Error listing warnings:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error listing warnings.') });
    }
};

const resetWarnings = async (sock, chatId, userId) => {
    try {
        const { data, error } = await supabase
            .from('warnings')
            .delete()
            .eq('group_id', chatId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error resetting warnings:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error resetting warnings.') });
            return;
        }

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`✅ Warnings for user @${userId.split('@')[0]} have been reset.`), mentions: [userId] });
        console.log(`✅ Warnings reset for user ${userId} in group: ${chatId}`);
    } catch (error) {
        console.error('Error resetting warnings:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error resetting warnings.') });
    }
};

async function kickUser(sock, chatId, userId) {
    try {
        await sock.groupParticipantsUpdate(chatId, [userId], 'remove');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🚫 User ${userId} has been removed from the group.`) });
    } catch (error) {
        console.error("Error kicking user:", error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error kicking user.') });
    }
}

module.exports = { warnUser, listWarnings, resetWarnings, kickUser };