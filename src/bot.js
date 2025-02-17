const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const config = require('./config/config');
const { welcomeMessage, updateUserStats } = require('./utils/utils');
const adminCommands = require('./message-controller/admincommand');
const botCommands = require('./message-controller/botcommand');
const commonCommands = require('./message-controller/commoncommand');
const scheduleCommands = require('./message-controller/scheduleMessage');
const pollCommands = require('./message-controller/polls');
const tournamentCommands = require('./message-controller/tournaments');

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

const handleIncomingMessages = async (sock, m) => {
    try {
        const message = m.messages[0];
        if (!message.message) return;

        const msgText = message.message.conversation || message.message.extendedTextMessage?.text || '';
        const chatId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        console.log(`📩 Message received from ${sender}: ${msgText}`);
        console.log(`📥 Incoming message: ${msgText}`);
        console.log(`🔍 Checking prefix: ${msgText.startsWith(config.botSettings.commandPrefix)}`);
        console.log(`🔍 Message Text: "${msgText}"`);
        console.log(`🔍 Prefix from config: "${config.botSettings.commandPrefix}"`);
        console.log(`🔍 Checking prefix: ${msgText.trim().startsWith(config.botSettings.commandPrefix)}`);

        const isGroup = chatId.endsWith('@g.us') || chatId.endsWith('@broadcast');

        if (!config.botSettings.enabled) {
            if (msgText.trim().startsWith(config.botSettings.commandPrefix)) {
                const args = msgText.trim().split(/ +/);
                const command = args.shift().slice(config.botSettings.commandPrefix.length).toLowerCase();
                if (command === 'enable' && sender === config.botOwnerId) {
                    config.botSettings.enabled = true;
                    await sock.sendMessage(chatId, { text: formatResponse('✅ Bot has been enabled.') });
                } else {
                    await sock.sendMessage(chatId, { text: formatResponse('The bot is disabled. Please try again later.') });
                }
            }
            console.log('🛑 Bot is disabled.');
            return;
        }

        if (!isGroup && msgText.trim() !== '.bot' && sender !== config.botOwnerId) {
            console.log('🛑 Ignoring non-group message from non-owner');
            return;
        }

        if (!msgText.trim().startsWith(config.botSettings.commandPrefix)) {
            console.log('🛑 Ignoring non-command message');
            await adminCommands.detectAndDeleteSpam(sock, chatId, message);
            await adminCommands.detectAndDeleteLinks(sock, chatId, message);
            return;
        }

        const args = msgText.trim().split(/ +/);
        const command = args.shift().slice(config.botSettings.commandPrefix.length).toLowerCase();
        console.log(`🛠 Extracted Command: ${command}`);
        console.log(`✅ Processing command: ${command}`);

        let isAdmin = false;
        let isBotAdmin = false;
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                isAdmin = groupMetadata.participants.some(p =>
                    p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
                );
                isBotAdmin = groupMetadata.participants.some(p =>
                    p.id === config.botOwnerId && (p.admin === 'admin' || p.admin === 'superadmin')
                );
            } catch (e) {
                console.error("Error fetching group metadata:", e);
            }
        }

        const adminCommandSet = new Set(['ban', 'tagall', 'mute', 'unmute', 'announce', 'stopannounce', 'schedule', 'listscheduled', 'pin', 'unpin', 'clear', 'setgrouprules', 'settournamentrules', 'setlanguage', 'showstats', 'delete', 'startwelcome', 'stopwelcome']);

        if (adminCommandSet.has(command)) {
            if (!isGroup) {
                await sock.sendMessage(chatId, { text: formatResponse('This command is available only in group chats.') });
                return;
            }
            if (!isAdmin && sender !== config.botOwnerId) {
                await sock.sendMessage(chatId, { text: formatResponse('❌ You are not an admin to use this command.') });
                return;
            }
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: formatResponse('❌ Bot is not an admin in this group.') });
                return;
            }
        }

        switch (command) {
            case 'ping':
                await sock.sendMessage(chatId, { text: formatResponse('🏓 Pong! Bot is active.') });
                break;
            case 'help':
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
                await adminCommands.tagAll(sock, chatId, args.join(' '), sender);
                break;
            case 'mute':
                await adminCommands.startAnnouncement(sock, chatId, args.join(' '));
                break;
            case 'unmute':
                await adminCommands.stopAnnouncement(sock, chatId);
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
            case 'endtournament':
                await tournamentCommands.endTournament(sock, chatId, args);
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
                await adminCommands.setLanguage(sock, chatId, args);
                break;
            case 'showstats':
                await commonCommands.showAllGroupStats(sock, chatId);
                break;
            case 'delete':
                await adminCommands.deleteMessage(sock, chatId, message);
                break;
            case 'enable':
                if (sender === config.botOwnerId) {
                    config.botSettings.enabled = true;
                    await sock.sendMessage(chatId, { text: formatResponse('✅ Bot has been enabled.') });
                } else {
                    await sock.sendMessage(chatId, { text: formatResponse('❌ You do not have permission to enable the bot.') });
                }
                break;
            case 'disable':
                if (sender === config.botOwnerId) {
                    config.botSettings.enabled = false;
                    await sock.sendMessage(chatId, { text: formatResponse('❌ Bot has been disabled.') });
                } else {
                    await sock.sendMessage(chatId, { text: formatResponse('❌ You do not have permission to disable the bot.') });
                }
                break;
            case 'startwelcome':
                if (sender === config.botOwnerId) {
                    await adminCommands.startWelcome(sock, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: formatResponse('❌ You do not have permission to start welcome messages.') });
                }
                break;
            case 'stopwelcome':
                if (sender === config.botOwnerId) {
                    await adminCommands.stopWelcome(sock, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: formatResponse('❌ You do not have permission to stop welcome messages.') });
                }
                break;
            default:
                await sock.sendMessage(chatId, { text: formatResponse('❌ Unknown command! Use .help for commands list.') });
        }

        // Update user statistics for commands
        updateUserStats(sender, command);
    } catch (error) {
        console.error("❌ Error in command processing:", error);
    }
};

module.exports.startBot = (sock) => {
    sock.ev.on('messages.upsert', async (m) => {
        await handleIncomingMessages(sock, m);
    });

    sock.ev.on('group-participants.update', async (update) => {
        const chat = await sock.groupMetadata(update.id);
        const contact = update.participants[0];
        const user = contact.split('@')[0];
        if (update.action === 'add' && config.botSettings.welcomeMessagesEnabled) {
            await sock.sendMessage(chat.id, { text: formatResponse(welcomeMessage(user)) });
            console.log(`👋 Sent welcome message to ${user}`);
        }
    });
};