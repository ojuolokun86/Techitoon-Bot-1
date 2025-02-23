const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');

const showAllGroupStats = async (sock, chatId) => {
    try {
        const { data: stats, error } = await supabase
            .from('group_stats')
            .select('*')
            .eq('group_id', chatId);

        if (error) {
            console.error('Error fetching group stats:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error fetching group stats.') });
            return;
        }

        if (stats.length === 0) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('No statistics found for this group.') });
            return;
        }

        let statsMessage = '📊 **Group Statistics:**\n\n';
        const userStats = {};

        stats.forEach(stat => {
            if (!userStats[stat.user_id]) {
                userStats[stat.user_id] = [];
            }
            userStats[stat.user_id].push(`${stat.name}: ${stat.value}`);
        });

        for (const [userId, userStat] of Object.entries(userStats)) {
            statsMessage += `👤 @${userId.split('@')[0]}:\n`;
            statsMessage += userStat.join('\n');
            statsMessage += '\n\n';
        }

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(statsMessage), mentions: Object.keys(userStats) });
    } catch (error) {
        console.error('Error showing group stats:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error showing group stats.') });
    }
};

module.exports = { showAllGroupStats };