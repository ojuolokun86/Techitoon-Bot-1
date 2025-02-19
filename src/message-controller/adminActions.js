const { formatResponseWithHeaderFooter } = require('../utils/utils');

async function promoteUser(sock, chatId, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const botNumber = "2348026977793@s.whatsapp.net"; // Your bot's number
        const isBotAdmin = groupMetadata.participants.some(p => p.id === botNumber && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isBotAdmin) {
            console.log("❌ Bot is not an admin, cannot promote users.");
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("❌ Bot is not an admin, cannot promote users.") });
            return;
        }

        const mentionedParticipant = message.message.extendedTextMessage.contextInfo.mentionedJid[0]; // Get mentioned participant

        if (!mentionedParticipant) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("❌ Please mention a user to promote.") });
            return;
        }

        // Promote user to admin
        await sock.groupParticipantsUpdate(chatId, [mentionedParticipant], 'promote');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🎉 @${mentionedParticipant.split('@')[0]} has been promoted to admin!`), mentions: [mentionedParticipant] });
    } catch (err) {
        console.error("Error promoting user:", err);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("⚠️ Error promoting user.") });
    }
}

async function demoteUser(sock, chatId, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const botNumber = "2348026977793@s.whatsapp.net"; // Your bot's number
        const isBotAdmin = groupMetadata.participants.some(p => p.id === botNumber && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isBotAdmin) {
            console.log("❌ Bot is not an admin, cannot demote users.");
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("❌ Bot is not an admin, cannot demote users.") });
            return;
        }

        const mentionedParticipant = message.message.extendedTextMessage.contextInfo.mentionedJid[0]; // Get mentioned participant

        if (!mentionedParticipant) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("❌ Please mention a user to demote.") });
            return;
        }

        // Demote user from admin
        await sock.groupParticipantsUpdate(chatId, [mentionedParticipant], 'demote');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`❌ @${mentionedParticipant.split('@')[0]} has been demoted from admin!`), mentions: [mentionedParticipant] });
    } catch (err) {
        console.error("Error demoting user:", err);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter("⚠️ Error demoting user.") });
    }
}

module.exports = { promoteUser, demoteUser };