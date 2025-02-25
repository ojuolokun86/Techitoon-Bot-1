const { formatResponseWithHeaderFooter } = require('../utils/utils');
const { warnUser } = require('./warning');
const config = require('../config/config');

const salesKeywords = [
    'sell', 'sale', 'selling', 'buy', 'buying', 'trade', 'trading', 'swap', 'swapping', 'exchange', 'price', 'available for sale', 'dm for price', 'account for sale', 'selling my account', 'who wants to buy', 'how much?', '$', '₦', 'paypal', 'btc'
];

const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|t\.me\/[^\s]+|bit\.ly\/[^\s]+|[\w-]+\.(com|net|org|info|biz|xyz|live|tv|me|link)(\/\S*)?)/gi;

const showAllGroupStats = async (sock, chatId) => {
    try {
        // Fetch group stats from Supabase
        const { data: stats, error } = await supabase
            .from('group_stats')
            .select('*')
            .eq('group_id', chatId);

        if (error) {
            console.error('Error fetching group stats:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Error fetching group stats.') });
            return;
        }

        if (!stats || stats.length === 0) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('📊 No stats available for this group.') });
            return;
        }

        // Format the stats into a readable message
        let statsMessage = '📊 *Group Stats* 📊\n\n';
        stats.forEach(stat => {
            statsMessage += `👤 *User*: @${stat.user_id.split('@')[0]}\n`;
            statsMessage += `📅 *Messages Sent*: ${stat.messages_sent}\n`;
            statsMessage += `👍 *Reactions*: ${stat.reactions}\n`;
            statsMessage += `⚠️ *Warnings*: ${stat.warnings}\n\n`;
        });

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(statsMessage) });
    } catch (error) {
        console.error('Error showing group stats:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Error showing group stats.') });
    }
};

const handleProtectionMessages = async (sock, message) => {
    try {
        const msgText = message.message?.conversation || message.message?.extendedTextMessage?.text || message.message?.imageMessage?.caption || message.message?.videoMessage?.caption || '';
        const chatId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        console.log(`Checking message for protection: ${msgText} from ${sender} in ${chatId}`);

        // Log the configuration values
        console.log(`Sales warning threshold: ${config.warningThreshold.sales}`);
        console.log(`Links warning threshold: ${config.warningThreshold.links}`);

        // Check if the sender is an admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (isAdmin) {
            console.log(`Skipping protection check for admin: ${sender}`);
            return;
        }

        // Check for sales keywords in media captions
        const containsSalesKeywords = salesKeywords.some(keyword => msgText.toLowerCase().includes(keyword));
        if (containsSalesKeywords && (message.message?.imageMessage || message.message?.videoMessage)) {
            // Delete the media message
            await sock.sendMessage(chatId, { delete: message.key });
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Media message deleted due to violation of group rules (sales content detected).') });

            console.log(`⚠️ Media message from ${sender} deleted in group: ${chatId} (sales content detected)`);

            // Warn the user with a threshold of 2 warnings for sales content
            await warnUser(sock, chatId, sender, 'Posting sales content', config.warningThreshold.sales);
            return;
        }

        // Check for links
        if (linkRegex.test(msgText)) {
            // Delete the message
            await sock.sendMessage(chatId, { delete: message.key });
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Message deleted due to violation of group rules (link detected).') });

            console.log(`⚠️ Message from ${sender} deleted in group: ${chatId} (link detected)`);

            // Warn the user with a threshold of 3 warnings for links
            await warnUser(sock, chatId, sender, 'Posting links', config.warningThreshold.links);
            return;
        }
    } catch (error) {
        console.error('Error handling protection messages:', error);
    }
};

module.exports = { handleProtectionMessages, showAllGroupStats };

