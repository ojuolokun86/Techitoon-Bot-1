const { formatResponseWithHeaderFooter } = require('../utils/utils');
const { issueWarning } = require('./warning'); // Import issueWarning from warning.js
const config = require('../config/config');
const supabase = require('../supabaseClient');

const salesKeywords = [
    'sell', 'sale', 'selling', 'buy', 'buying', 'trade', 'trading', 'swap', 'swapping', 'exchange', 'price',
    'available for sale', 'dm for price', 'account for sale', 'selling my account', 'who wants to buy', 'how much?',
    '$', '₦', 'paypal', 'btc'
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
        const msgText = message.message?.conversation || message.message?.extendedTextMessage?.text || 
                        message.message?.imageMessage?.caption || message.message?.videoMessage?.caption || '';
        const chatId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        console.log(`Checking message for protection: ${msgText} from ${sender} in ${chatId}`);

        // Get group metadata to check admin status
        let groupMetadata;
        try {
            groupMetadata = await sock.groupMetadata(chatId);
        } catch (error) {
            console.error('Error fetching group metadata:', error);
            return;
        }

        const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (isAdmin) {
            console.log(`Skipping protection check for admin: ${sender}`);
            return;
        }

        // **Sales Content Detection**
        const containsSalesKeywords = salesKeywords.some(keyword => msgText.toLowerCase().includes(keyword));
        if (containsSalesKeywords && (message.message?.imageMessage || message.message?.videoMessage)) {
            await sock.sendMessage(chatId, { delete: message.key });
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Media message deleted due to violation of group rules (sales content detected).') });

            console.log(`⚠️ Media message from ${sender} deleted in group: ${chatId} (sales content detected)`);

            // **Move warning handling to warning.js**
            await issueWarning(sock, chatId, sender, 'Posting sales content', config.warningThreshold.sales);
            return;
        }

        // **Link Detection**
        if (linkRegex.test(msgText)) {
            await sock.sendMessage(chatId, { delete: message.key });
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Message deleted due to violation of group rules (link detected).') });

            console.log(`⚠️ Message from ${sender} deleted in group: ${chatId} (link detected)`);

            // **Move warning handling to warning.js**
            await issueWarning(sock, chatId, sender, 'Posting links', config.warningThreshold.links);
            return;
        }
    } catch (error) {
        console.error('Error handling protection messages:', error);
    }
};

let antiDeleteGroups = new Set(); // Store groups with anti-delete enabled

function toggleAntiDelete(groupId, state) {
    if (state === 'on') {
        antiDeleteGroups.add(groupId);
    } else {
        antiDeleteGroups.delete(groupId);
    }
}

const handleAntiDelete = (sock, message, botNumber) => {
    const { remoteJid: chatId, participant: sender, message: deletedMessage } = message.key;

    if (antiDeleteGroups.has(chatId) && sender !== botNumber) {
        console.log(`Restoring deleted message from ${sender}: ${deletedMessage}`);
        // Code to resend deleted message
        sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🔄 Restored message from ${sender}: ${deletedMessage}`) });
    }
};

module.exports = { handleProtectionMessages, showAllGroupStats, handleAntiDelete, toggleAntiDelete };

