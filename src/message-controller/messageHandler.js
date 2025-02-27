const { sendMessage, sendReaction } = require('../utils/messageUtils');
const supabase = require('../supabaseClient');
const { issueWarning, resetWarnings, listWarnings } = require('../message-controller/warning');
const config = require('../config/config');
const { updateUserStats } = require('../utils/utils');
const commonCommands = require('../message-controller/commonCommands');
const adminCommands = require('../message-controller/adminActions');
const botCommands = require('../message-controller/botCommands');
const scheduleCommands = require('../message-controller/scheduleMessage');
const pollCommands = require('../message-controller/polls');
const tournamentCommands = require('../message-controller/tournament');
const { handleProtectionMessages } = require('../message-controller/protection');
const { exec } = require("child_process");

const showAllGroupStats = async (sock, chatId) => {
    try {
        // Fetch group stats from Supabase
        const { data: stats, error } = await supabase
            .from('group_stats')
            .select('*')
            .eq('group_id', chatId);

        if (error) {
            console.error('Error fetching group stats:', error);
            await sendMessage(sock, chatId, '❌ Error fetching group stats.');
            return;
        }

        if (!stats || stats.length === 0) {
            await sendMessage(sock, chatId, '📊 No stats available for this group.');
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

        await sendMessage(sock, chatId, statsMessage);
    } catch (error) {
        console.error('Error showing group stats:', error);
        await sendMessage(sock, chatId, '❌ Error showing group stats.');
    }
};

const handleIncomingMessages = async (sock, m) => {
    try {
        const message = m.messages[0];
        if (!message.message) return;

        const msgText = message.message.conversation || message.message.extendedTextMessage?.text || message.message.imageMessage?.caption || message.message.videoMessage?.caption || '';
        const chatId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const isChannel = chatId.endsWith('@broadcast');
        const isPrivateChat = !isGroup && !isChannel;
        const isBackupNumber = sender === config.backupNumber;

        console.log(`Received message: ${msgText} from ${sender} in ${chatId}`);

        if (!msgText.trim().startsWith(config.botSettings.commandPrefix)) {
            console.log('🛑 Ignoring non-command message');
            await handleProtectionMessages(sock, message);
            return;
        }

        const args = msgText.trim().split(/ +/);
        const command = args.shift().slice(config.botSettings.commandPrefix.length).toLowerCase();
        console.log(`🛠 Extracted Command: ${command}`);

        // React to the command message
        await sendReaction(sock, chatId, message.key.id, command);

        // Fetch group/channel settings from Supabase
        let groupSettings = null;
        if (isGroup || isChannel) {
            const { data, error } = await supabase
                .from('group_settings')
                .select('bot_enabled')
                .eq('group_id', chatId)
                .single();
            groupSettings = data;
            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching group settings:', error);
            }
        }

        if ((isGroup || isChannel) && (!groupSettings || !groupSettings.bot_enabled)) {
            if (command === 'enable' && (sender === config.botOwnerId || isBackupNumber)) {
                await adminCommands.enableBot(sock, chatId, sender);
            } else if (command === 'disable' && (sender === config.botOwnerId || isBackupNumber)) {
                await adminCommands.disableBot(sock, chatId, sender);
            } else {
                console.log('Bot is disabled, cannot send message.');
                await sendMessage(sock, chatId, 'Oops! 🤖 The bot is currently disabled in this group/channel. Don\'t worry, the bot owner can enable it soon! 😊 Please try again later! 🙏');
            }
            console.log('🛑 Bot is disabled in this group/channel.');
            return;
        }

        if (isPrivateChat) {
            console.log('📩 Processing private chat message');
        } else if (isGroup || isChannel) {
            console.log('📩 Processing group/channel message');
        }

        // Check if the sender is an admin
        const isAdmin = await checkIfAdmin(sock, chatId, sender);

        // Handle the resetwarn command
        if (command === 'resetwarn' && args.length > 0) {
            const userId = args[0].replace('@', '') + '@s.whatsapp.net';
            await resetWarnings(sock, chatId, userId);
            return;
        }

        // Handle the listwarn command
        if (command === 'listwarn') {
            await listWarnings(sock, chatId);
            return;
        }

        // Handle other commands
        switch (command) {
            case 'ping':
                console.log('Sending pong message');
                await sendMessage(sock, chatId, '🏓 Pong! Bot is active.');
                break;
            case 'menu':
                await commonCommands.sendHelpMenu(sock, chatId, isGroup, isAdmin);
                break;
            case 'joke':
                await commonCommands.sendJoke(sock, chatId);
                break;
            case 'quote':
                await commonCommands.sendQuote(sock, chatId);
                break;
            case 'weather':
                await botCommands.handleWeatherCommand(sock, message, args);
                break;
            case 'translate':
                await botCommands.handleTranslateCommand(sock, message, args);
                break;
            case 'admin':
                await commonCommands.listAdmins(sock, chatId);
                break;
            case 'info':
                await commonCommands.sendGroupInfo(sock, chatId);
                break;
            case 'rules':
                await commonCommands.sendGroupRules(sock, chatId);
                break;
            case 'clear':
                await adminCommands.clearChat(sock, chatId);
                break;
            case 'ban':
                await adminCommands.banUser(sock, chatId, args);
                break;
            case 'tagall':
                const groupMetadata = await sock.groupMetadata(chatId);
                const participants = groupMetadata.participants.map(p => p.id);
                const mentions = participants.map(p => `@${p.split('@')[0]}`).join(' ');
                const tagallMessage = `
📢 *Tag All Command* 📢
👤 *User*: @${sender.split('@')[0]}
👥 *Group*: ${groupMetadata.subject}
📝 *Message*: ${args.join(' ')}
`;
                await sendMessage(sock, chatId, tagallMessage, mentions);
                break;
            case 'mute':
                await adminCommands.muteChat(sock, chatId);
                break;
            case 'unmute':
                await adminCommands.unmuteChat(sock, chatId);
                break;
            case 'announce':
                await adminCommands.startAnnouncement(sock, chatId, args.join(' '));
                break;
            case 'stopannounce':
                await adminCommands.stopAnnouncement(sock, chatId);
                break;
            case 'schedule':
                await scheduleCommands.scheduleMessage(sock, chatId, args);
                break;
            case 'remind':
                await scheduleCommands.remind(sock, chatId, args);
                break;
            case 'cancelschedule':
                await scheduleCommands.cancelSchedule(sock, chatId, args);
                break;
            case 'cancelreminder':
                await scheduleCommands.cancelReminder(sock, chatId);
                break;
            case 'poll':
                await pollCommands.createPoll(sock, chatId, args);
                break;
            case 'vote':
                await pollCommands.vote(sock, chatId, args);
                break;
            case 'endpoll':
                await pollCommands.endPoll(sock, chatId);
                break;
            case 'starttournament':
                await tournamentCommands.startTournament(sock, chatId, args);
                break;
            case 'addteam':
                await tournamentCommands.addTeam(sock, chatId, args);
                break;
            case 'register':
                await tournamentCommands.registerUser(sock, chatId, args);
                break;
            case 'endtournament':
                await tournamentCommands.endTournament(sock, chatId);
                break;
            case 'tournamentstatus':
                await tournamentCommands.tournamentStatus(sock, chatId);
                break;
            case 'setgrouprules':
                await adminCommands.setGroupRules(sock, chatId, args.join(' '));
                break;
            case 'settournamentrules':
                await adminCommands.setTournamentRules(sock, chatId, args.join(' '));
                break;
            case 'setlanguage':
                await adminCommands.setLanguage(sock, chatId, args.join(' '));
                break;
            case 'showstats':
                await showAllGroupStats(sock, chatId);
                break;
            case 'delete':
                await adminCommands.deleteMessage(sock, chatId, message);
                break;
            case 'enable':
                await adminCommands.enableBot(sock, chatId, sender);
                break;
            case 'disable':
                await adminCommands.disableBot(sock, chatId, sender);
                break;
            case 'startwelcome':
                await adminCommands.startWelcome(sock, chatId);
                break;
            case 'stopwelcome':
                await adminCommands.stopWelcome(sock, chatId);
                break;
            case 'promote':
                await adminCommands.promoteUser(sock, chatId, args[0]);
                break;
            case 'demote':
                await adminCommands.demoteUser(sock, chatId, args[0]);
                break;
            case 'warn':
                const userId = args[0].replace('@', '') + '@s.whatsapp.net';
                const reason = args.slice(1).join(' ') || 'No reason provided';
                await issueWarning(sock, chatId, userId, reason, config.warningThreshold.sales);
                break;
            case 'listwarn':
                await listWarnings(sock, chatId);
                break;
            case 'resetwarn':
                const resetUserId = args[0].replace('@', '') + '@s.whatsapp.net';
                await resetWarnings(sock, chatId, resetUserId);
                break;
            case 'addcommand':
                const [accessLevel, cmd, ...responseParts] = args;
                const response = responseParts.join(' ');
                await addCommand(sock, chatId, cmd, response, accessLevel);
                break;
            case 'deletecommand':
                const delCommand = args[0];
                await deleteCommand(sock, chatId, delCommand);
                break;
            default:
                console.log(`Unknown command: ${command}`);
                await sendMessage(sock, chatId, '❌ Unknown command! Use .menu for commands list.');
        }

        // Update user statistics for commands
        updateUserStats(sender, command);
    } catch (error) {
        console.error("❌ Error in command processing:", error);
    }
};

const callCommand = async (sock, chatId, command) => {
    try {
        const { data, error } = await supabase
            .from('commands')
            .select('response')
            .eq('command_name', command)
            .single();

        if (error || !data) {
            await sendMessage(sock, chatId, '❌ Command not found.');
            return;
        }

        await sendMessage(sock, chatId, data.response);
    } catch (error) {
        console.error('Error executing custom command:', error);
        await sendMessage(sock, chatId, '⚠️ Error executing command.');
    }
};

// Handle new participants joining the group
const handleNewParticipants = async (sock, chatId, participants) => {
    try {
        for (const participant of participants) {
            const welcomeMessage = `👋 Welcome @${participant.split('@')[0]} to the group! Please read the group rules.`;
            await sendMessage(sock, chatId, welcomeMessage, [participant]);
            console.log(`👋 Sent welcome message to ${participant}`);
        }
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
};

const checkIfAdmin = async (sock, chatId, userId, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            return groupMetadata.participants.some(p => p.id === userId && (p.admin === 'admin' || p.admin === 'superadmin'));
        } catch (error) {
            if (i === retries - 1) {
                console.error('Error checking admin status:', error);
                return false;
            }
            console.log(`Retrying checkIfAdmin (${i + 1}/${retries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = { handleIncomingMessages, handleNewParticipants, checkIfAdmin };