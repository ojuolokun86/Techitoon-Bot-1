const { formatResponseWithHeaderFooter, welcomeMessage } = require('../utils/utils');
const supabase = require('../supabaseClient');

const handleGroupParticipantsUpdate = async (sock, update) => {
    try {
        console.log('👥 Group participants update:', update);
        const chat = await sock.groupMetadata(update.id);
        const contact = update.participants[0];
        const user = contact.split('@')[0];
        const { data: groupSettings, error } = await supabase
            .from('group_settings')
            .select('welcome_messages_enabled')
            .eq('group_id', update.id)
            .single();

        if (error) {
            console.error('Error fetching group settings:', error);
            return;
        }

        if (update.action === 'add' && groupSettings && groupSettings.welcome_messages_enabled) {
            await sock.sendMessage(chat.id, { text: formatResponseWithHeaderFooter(welcomeMessage(chat.subject, user)) });
            console.log(`👋 Sent welcome message to ${user}`);
        }
    } catch (error) {
        console.error('Error handling group participants update:', error);
    }
};

module.exports = { handleGroupParticipantsUpdate };