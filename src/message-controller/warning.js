const { formatResponseWithHeaderFooter } = require('../utils/utils');
const supabase = require('../supabaseClient');
const config = require('../config/config');

const warnUser = async (sock, chatId, userId, reason, warningThreshold) => {
    try {
        // Fetch current warning count
        const { data: existingWarnings, error: fetchError } = await supabase
            .from('warnings')
            .select('*')
            .eq('user_id', userId)
            .eq('group_id', chatId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching existing warnings:', fetchError);
            return;
        }

        let warningCount = existingWarnings ? existingWarnings.count : 0;
        warningCount += 1;

        // Update warning count
        const { error: updateError } = await supabase
            .from('warnings')
            .upsert({ user_id: userId, group_id: chatId, reason: reason, count: warningCount }, { onConflict: ['user_id', 'group_id'] });

        if (updateError) {
            console.error('Error updating warning count:', updateError);
            return;
        }

        // Calculate remaining warnings before kick
        const remainingWarnings = warningThreshold - warningCount;

        // Send warning message
        let warningMessage = `⚠️ @${userId.split('@')[0]}, you have been warned for: ${reason}. This is warning #${warningCount}.`;
        if (remainingWarnings > 0) {
            warningMessage += ` You will be kicked after ${remainingWarnings} more warning(s).`;
        }
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(warningMessage), mentions: [userId] });

        console.log(`⚠️ User ${userId} warned in group: ${chatId}`);

        // Check if the warning count exceeds the threshold
        if (warningCount >= warningThreshold) {
            // Kick the user out of the group
            await sock.groupParticipantsUpdate(chatId, [userId], 'remove');
            const kickMessage = `🚫 @${userId.split('@')[0]} has been removed from the group due to exceeding the warning limit.`;
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(kickMessage), mentions: [userId] });

            console.log(`🚫 User ${userId} removed from group: ${chatId} due to exceeding the warning limit`);
        }
    } catch (error) {
        console.error('Error warning user:', error);
    }
};

const resetWarnings = async (sock, chatId, userId) => {
    try {
        // Reset the warning count for the user
        const { error } = await supabase
            .from('warnings')
            .update({ count: 0 })
            .eq('user_id', userId)
            .eq('group_id', chatId);

        if (error) {
            console.error('Error resetting warnings:', error);
            return;
        }

        // Send reset confirmation message
        const resetMessage = `✅ @${userId.split('@')[0]}'s warnings have been reset.`;
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(resetMessage), mentions: [userId] });

        console.log(`✅ Warnings for user ${userId} reset in group: ${chatId}`);
    } catch (error) {
        console.error('Error resetting warnings:', error);
    }
};

const listWarnings = async (sock, chatId) => {
    try {
        // Fetch warnings for the group
        const { data: warnings, error } = await supabase
            .from('warnings')
            .select('*')
            .eq('group_id', chatId);

        if (error) {
            console.error('Error fetching warnings:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Error fetching warnings.') });
            return;
        }

        if (!warnings || warnings.length === 0) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('📊 No warnings in this group.') });
            return;
        }

        // Format the warnings into a readable message
        let warningsMessage = '📊 *Group Warnings* 📊\n\n';
        warnings.forEach(warning => {
            warningsMessage += `👤 *User*: @${warning.user_id.split('@')[0]}\n`;
            warningsMessage += `⚠️ *Warnings*: ${warning.count}\n`;
            warningsMessage += `📝 *Reason*: ${warning.reason}\n\n`;
        });

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(warningsMessage) });
    } catch (error) {
        console.error('Error listing warnings:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Error listing warnings.') });
    }
};

module.exports = { warnUser, resetWarnings, listWarnings };