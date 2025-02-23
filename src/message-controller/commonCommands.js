const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');
const axios = require('axios');

// Function to show all group statistics
const showAllGroupStats = async (sock, chatId) => {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const totalMembers = groupMetadata.participants.length;
        const memberList = groupMetadata.participants.map(p => `👤 @${p.id.split('@')[0]}`).join('\n');

        // Fetch activity statistics from the database
        const { data: chatStats, error: chatError } = await supabase
            .from('chat_stats')
            .select('user_id, message_count')
            .eq('group_id', chatId)
            .order('message_count', { ascending: false })
            .limit(5);

        const { data: commandStats, error: commandError } = await supabase
            .from('command_stats')
            .select('user_id, command_count')
            .eq('group_id', chatId)
            .order('command_count', { ascending: false })
            .limit(5);

        if (chatError || commandError) {
            throw new Error('Error fetching activity statistics');
        }

        const mostActiveMembers = chatStats.map(stat => `👤 @${stat.user_id.split('@')[0]}: ${stat.message_count} messages`).join('\n');
        const mostCommandUsers = commandStats.map(stat => `👤 @${stat.user_id.split('@')[0]}: ${stat.command_count} commands`).join('\n');

        const statsMessage = `
📊 *Group Statistics:*

👥 *Total Members:* ${totalMembers}

${memberList}

🔥 *Most Active Members:*
${mostActiveMembers}

⚙️ *Most Command Usage:*
${mostCommandUsers}
        `;

        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(statsMessage), mentions: groupMetadata.participants.map(p => p.id) });
    } catch (error) {
        console.error('Error fetching group stats:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error fetching group statistics.') });
    }
};

// Function to update user statistics
const updateUserStats = async (userId, groupId, statName) => {
    try {
        const { data, error } = await supabase
            .from('group_stats')
            .upsert({ user_id: userId, group_id: groupId, name: statName, value: 1 }, { onConflict: ['user_id', 'group_id', 'name'] })
            .eq('user_id', userId)
            .eq('group_id', groupId)
            .eq('name', statName)
            .increment('value', 1);

        if (error) {
            console.error('Error updating user stats:', error);
        }
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
};

async function sendJoke(sock, chatId) {
    try {
        const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
        const joke = `${response.data.setup}\n\n${response.data.punchline}`;
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(joke) });
    } catch (error) {
        console.error('Error fetching joke:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not fetch a joke at this time.') });
    }
}

async function sendQuote(sock, chatId) {
    try {
        const response = await axios.get('https://api.quotable.io/random');
        const quote = `${response.data.content} — ${response.data.author}`;
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(quote) });
    } catch (error) {
        console.error('Error fetching quote:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not fetch a quote at this time.') });
    }
}

module.exports = {
    showAllGroupStats,
    updateUserStats,
    sendJoke,
    sendQuote
};