const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');
const cron = require('node-cron');

let scheduledTasks = {};

const saveLink = async (sock, chatId, sender, args) => {
    try {
        const title = args[0];
        const link = args[1];
        const description = args.slice(2).join(' ') || null;

        const { data, error } = await supabase
            .from('links')
            .insert([{ group_id: chatId, title, link, description, added_by: sender }]);

        if (error) {
            throw error;
        }

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Link saved successfully!') });
    } catch (error) {
        console.error('Error saving link:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error saving link.') });
    }
};

const shareLink = async (sock, chatId, args) => {
    try {
        const title = args.join(' ');

        const { data, error } = await supabase
            .from('links')
            .select('link')
            .eq('group_id', chatId)
            .eq('title', title)
            .single();

        if (error || !data) {
            throw new Error('Link not found');
        }

        const link = data.link;

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🔗 Shared link: ${link}`) });

        // Schedule task to repost the link every 2 hours
        if (scheduledTasks[chatId]) {
            scheduledTasks[chatId].stop();
        }

        scheduledTasks[chatId] = cron.schedule('0 */2 * * *', async () => {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🔗 Check out this link: ${link}`) });
            console.log(`🔄 Reposted the shared link in ${chatId}.`);
        });

        console.log(`✅ Scheduled reposting of the link in ${chatId} every 2 hours.`);
    } catch (error) {
        console.error('Error sharing link:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error sharing link.') });
    }
};

const deleteLink = async (sock, chatId, args) => {
    try {
        const title = args.join(' ');

        const { data, error } = await supabase
            .from('links')
            .delete()
            .eq('group_id', chatId)
            .eq('title', title);

        if (error) {
            throw error;
        }

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Link deleted successfully!') });
    } catch (error) {
        console.error('Error deleting link:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error deleting link.') });
    }
};

const listLinks = async (sock, chatId) => {
    try {
        const { data, error } = await supabase
            .from('links')
            .select('title, link, description')
            .eq('group_id', chatId);

        if (error) {
            throw error;
        }

        if (data.length === 0) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('No links found.') });
            return;
        }

        const linksList = data.map(link => `🔗 *Title:* ${link.title}\n*Link:* ${link.link}\n*Description:* ${link.description || 'No description'}`).join('\n\n');

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`📄 *Saved Links:*\n\n${linksList}`) });
    } catch (error) {
        console.error('Error listing links:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error listing links.') });
    }
};

module.exports = { saveLink, shareLink, deleteLink, listLinks };