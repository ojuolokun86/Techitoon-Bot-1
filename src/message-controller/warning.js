const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');

const warnUser = async (sock, chatId, userId, reason) => {
    try {
        // Check existing warnings
        const { data: warnings, error: fetchError } = await supabase
            .from('warnings')
            .select('*')
            .eq('user_id', userId)
            .eq('group_id', chatId);

        if (fetchError) {
            console.error('Error fetching warnings:', fetchError);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error fetching warnings.') });
            return;
        }

        let warningCount = warnings.length;

        // Add new warning
        const { error: insertError } = await supabase
            .from('warnings')
            .insert([{ user_id: userId, group_id: chatId, reason }]);

        if (insertError) {
            console.error('Error adding warning:', insertError);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error adding warning.') });
            return;
        }

        warningCount += 1;

        // Send warning message
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`⚠️ Warning ${warningCount}: ${reason}`) });

        // Check if user should be kicked
        if (reason.includes('link') && warningCount >= 3) {
            await kickUser(sock, chatId, userId);
        } else if (reason.includes('sales') && warningCount >= 2) {
            await kickUser(sock, chatId, userId);
        }
    } catch (error) {
        console.error('Error warning user:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error warning user.') });
    }
};

const listWarnings = async (sock, chatId) => {
    try {
        const { data: warnings, error } = await supabase
            .from('warnings')
            .select('*')
            .eq('group_id', chatId);

        if (error) {
            console.error('Error fetching warnings:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error fetching warnings.') });
            return;
        }

        if (warnings.length === 0) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('No warnings found for this group.') });
            return;
        }

        let warningMessage = '⚠️ **Warnings for this group:**\n\n';
        warnings.forEach((warning, index) => {
            warningMessage += `${index + 1}. User: @${warning.user_id.split('@')[0]}, Reason: ${warning.reason}\n`;
        });

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(warningMessage), mentions: warnings.map(w => w.user_id) });
    } catch (error) {
        console.error('Error listing warnings:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error listing warnings.') });
    }
};

const kickUser = async (sock, chatId, userId) => {
    try {
        await sock.groupParticipantsUpdate(chatId, [userId], 'remove');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🚫 User @${userId.split('@')[0]} has been kicked for repeated violations.`), mentions: [userId] });
    } catch (error) {
        console.error('Error kicking user:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error kicking user.') });
    }
};

module.exports = { warnUser, listWarnings, kickUser };