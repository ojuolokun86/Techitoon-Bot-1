const { formatResponseWithHeaderFooter } = require('../utils/utils');
const supabase = require('../supabaseClient');

const enableBot = async (sock, chatId, sender) => {
    try {
        const { data, error } = await supabase
            .from('group_settings')
            .upsert({ group_id: chatId, bot_enabled: true }, { onConflict: ['group_id'] });

        if (error) {
            console.error('Error enabling bot:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Error enabling the bot.') });
            return;
        }

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Bot has been enabled in this group.') });
        console.log(`✅ Bot enabled in group: ${chatId} by ${sender}`);
    } catch (error) {
        console.error('Error enabling bot:', error);
    }
};

const disableBot = async (sock, chatId, sender) => {
    try {
        const { data, error } = await supabase
            .from('group_settings')
            .upsert({ group_id: chatId, bot_enabled: false }, { onConflict: ['group_id'] });

        if (error) {
            console.error('Error disabling bot:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Error disabling the bot.') });
            return;
        }

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('🚫 Bot has been disabled in this group.') });
        console.log(`🚫 Bot disabled in group: ${chatId} by ${sender}`);
    } catch (error) {
        console.error('Error disabling bot:', error);
    }
};

module.exports = { enableBot, disableBot };