// This file contains utility functions that assist with various tasks, such as formatting messages, logging errors, and managing user statistics.

function formatMessage(message) {
    return message.trim().charAt(0).toUpperCase() + message.slice(1);
}

function logError(error) {
    console.error(`[ERROR] ${new Date().toISOString()}: ${error}`);
}

function isOwner(userId) {
    const ownerId = '2348026977793';
    return userId === ownerId;
}

function manageUserStats(userId, action) {
    // Placeholder for user statistics management logic
    // This could include incrementing message counts, tracking activity, etc.
}

const formatResponse = (text) => {
    return `
╔══════════════════╗
║ 🚀 *TECHITOON BOT* 🚀 ║
╚══════════════════╝

${text}

╭━ ⋅☆⋅ ━╮
  🤖 *Techitoon AI*
╰━ ⋅☆⋅ ━╯
    `;
};

const welcomeMessage = (user) => {
    return `👋 Welcome @${user}!`;
};

const updateUserStats = (user, command) => {
    // Update user statistics logic
};

const showGroupStats = async (sock, chatId) => {
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants;

    // Example logic to determine the most active member
    const userStats = {}; // This should be populated with actual user stats
    let mostActiveMember = null;
    let maxMessages = 0;

    for (const participant of participants) {
        const userId = participant.id.split('@')[0];
        const messageCount = userStats[userId] || 0; // Replace with actual message count
        if (messageCount > maxMessages) {
            maxMessages = messageCount;
            mostActiveMember = userId;
        }
    }

    let statsText = `📊 *Group Statistics*:\n\n`;
    statsText += `👥 *Total Members:* ${participants.length}\n\n`;

    if (mostActiveMember) {
        statsText += `🏆 *Most Active Member:* @${mostActiveMember} with ${maxMessages} messages\n\n`;
    }

    for (const participant of participants) {
        const userId = participant.id.split('@')[0];
        statsText += `👤 @${userId}\n`;
        // Add more stats for each user if available
    }

    await sock.sendMessage(chatId, { text: formatResponse(statsText), mentions: participants.map(p => p.id) });
};

module.exports = {
    formatResponse,
    welcomeMessage,
    updateUserStats,
    showGroupStats,
};