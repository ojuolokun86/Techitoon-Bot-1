const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const config = require('./config/config');
const { welcomeMessage, updateUserStats, formatResponseWithHeaderFooter } = require('./utils/utils');
const adminCommands = require('./message-controller/admincommand');
const botCommands = require('./message-controller/botcommand');
const commonCommands = require('./message-controller/commoncommand');
const scheduleCommands = require('./message-controller/scheduleMessage');
const pollCommands = require('./message-controller/polls');
const tournamentCommands = require('./message-controller/tournaments');
const { promoteUser, demoteUser } = require('./message-controller/adminActions');
const { warnUser, listWarnings, resetWarnings, kickUser } = require('./message-controller/warning');
const { addCommand, callCommand, deleteCommand } = require('./message-controller/commands');
const { saveLink, shareLink, deleteLink, listLinks, getSavedLinks } = require('./message-controller/links');
const supabase = require('./supabaseClient');
const storeAuthState = require('../auth/storeAuthState'); // Corrected file path
const retrieveAuthState = require('../auth/retrieveAuthState'); // Corrected file path
const { showAllGroupStats } = require('./message-controller/commonCommands');
const cron = require('node-cron');

const botNumber = "2348026977793@s.whatsapp.net";  // Your bot number

const scheduledTasks = {};

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

        const { data: groupSettings, error } = await supabase
            .from('group_settings')
            .select('bot_enabled')
            .eq('group_id', chatId)
            .single();

        if (error || !groupSettings || !groupSettings.bot_enabled) {
            if (msgText.trim().startsWith(config.botSettings.commandPrefix)) {
                const args = msgText.trim().split(/ +/);
                const command = args.shift().slice(config.botSettings.commandPrefix.length).toLowerCase();
                if (command === 'enable' && sender === config.botOwnerId) {
                    await commonCommands.enableBot(sock, chatId);
                } else if (command === 'disable' && sender === config.botOwnerId) {
                    await commonCommands.disableBot(sock, chatId);
                } else {
                    await sock.sendMessage(chatId, {
                        text: formatResponseWithHeaderFooter('Oops! 🤖 The bot is currently disabled in this group. Don\'t worry, the bot owner can enable it soon! 😊 Please try again later! 🙏'),
                    });
                }
            }
            console.log('🛑 Bot is disabled in this group.');
            return;
        }

        if (!isGroup && msgText.trim() !== '.bot' && sender !== config.botOwnerId) {
            console.log('🛑 Ignoring non-group message from non-owner');
            return;
        }

        if (!msgText.trim().startsWith(config.botSettings.commandPrefix)) {
            console.log('🛑 Ignoring non-command message');
            await handleProtectionMessages(sock, message);

            // Handle .delete command for quoted messages
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage && msgText.trim().toLowerCase() === '.delete') {
                try {
                    const quotedMessageKey = message.message.extendedTextMessage.contextInfo.stanzaId;
                    const quotedMessageRemoteJid = message.message.extendedTextMessage.contextInfo.participant || chatId;
                    await sock.sendMessage(chatId, { delete: { id: quotedMessageKey, remoteJid: quotedMessageRemoteJid, fromMe: true } });
                    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('🗑️ The message has been deleted.') });
                } catch (error) {
                    console.error("Error deleting message:", error);
                    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Could not delete the message.') });
                }
            }

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

        const adminCommandSet = new Set(['ban', 'tagall', 'mute', 'unmute', 'announce', 'stopannounce', 'schedule', 'listscheduled', 'pin', 'unpin', 'clear', 'setgrouprules', 'settournamentrules', 'setlanguage', 'showstats', 'delete', 'startwelcome', 'stopwelcome', 'promote', 'demote', 'enable', 'disable', 'warn', 'listwarn', 'resetwarn', 'addcommand', 'deletecommand', 'savelink', 'sharelink', 'deletelink', 'listlinks']);

        if (adminCommandSet.has(command)) {
            if (!isGroup) {
                await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('This command is available only in group chats.') });
                return;
            }
            if (!isAdmin && sender !== config.botOwnerId) {
                await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ You are not an admin to use this command.') });
                return;
            }
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ Bot is not an admin in this group.') });
                return;
            }
        }

        switch (command) {
            case 'ping':
                await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('🏓 Pong! Bot is active.') });
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
                await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(tagallMessage), mentions: participants });
                break;
            case 'mute':
                await adminCommands.startAnnouncement(sock, chatId, args.join(' '));
                break;
            case 'unmute':
                await adminCommands.stopAnnouncement(sock, chatId);
                break;
            case 'announce':
                if (args[0] === 'stop') {
                    await adminCommands.stopAnnouncement(sock, chatId);
                } else {
                    await adminCommands.startAnnouncement(sock, chatId, args.join(' '));
                }
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
                await showAllGroupStats(sock, chatId);
                break;
            case 'delete':
                await adminCommands.deleteMessage(sock, chatId, message);
                break;
            case 'enable':
                await adminCommands.enableBot(sock, chatId);
                break;
            case 'disable':
                await adminCommands.disableBot(sock, chatId);
                break;
            case 'startwelcome':
                await adminCommands.startWelcome(sock, chatId);
                break;
            case 'stopwelcome':
                await adminCommands.stopWelcome(sock, chatId);
                break;
            case 'promote':
                await promoteUser(sock, chatId, message);
                break;
            case 'demote':
                await demoteUser(sock, chatId, message);
                break;
            case 'warn':
                const userId = args[0].replace('@', '') + '@s.whatsapp.net';
                const reason = args.slice(1).join(' ') || 'No reason provided';
                await warnUser(sock, chatId, userId, reason);
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
                const functionName = responseParts.pop(); // Get the last argument as the function name
                await addCommand(sock, chatId, cmd, response, accessLevel, functionName);
                break;
            case 'deletecommand':
                const delCommand = args[0];
                await deleteCommand(sock, chatId, delCommand);
                break;
            case 'savelink':
                await saveLink(sock, chatId, args);
                break;
            case 'sharelink':
                await botCommands.handleShareLinkCommand(sock, chatId);
                break;
            case 'stoplink':
                await botCommands.handleStopLinkCommand(sock, chatId);
                break;
            case 'deletelink':
                const deleteTitle = args.join(' ');
                await deleteLink(sock, chatId, deleteTitle);
                break;
            case 'listlinks':
                await listLinks(sock, chatId);
                break;
            default:
                await callCommand(sock, chatId, command);
        }

        // Update user statistics for commands
        updateUserStats(sender, command);
    } catch (error) {
        console.error("❌ Error in command processing:", error);
    }
};

const handleProtectionMessages = async (sock, message) => {
    if (!message || !message.key || !message.message) {
        console.error('Invalid message object:', message);
        return;
    }

    const msgText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const chatId = message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;

    // Check if the user is an admin or the bot owner
    const groupMetadata = await sock.groupMetadata(chatId);
    const isAdmin = groupMetadata.participants.some(p =>
        p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
    );
    const isBotOwner = sender === config.botOwnerId;

    // Anti-Link Protection
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const links = msgText.match(linkRegex);
    if (links) {
        const { data: savedLinks, error } = await getSavedLinks(chatId);
        if (error) {
            console.error('Error fetching saved links:', error);
            return;
        }

        const isSavedLink = links.some(link => savedLinks.some(savedLink => savedLink.url === link));
        if (!isSavedLink && !isAdmin && !isBotOwner) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('🚫 Links are not allowed in this group.') });
            await sock.sendMessage(chatId, { delete: { id: message.key.id, remoteJid: chatId, fromMe: false } });
            await warnUser(sock, chatId, sender, 'Shared a link');
            return;
        }
    }

    // Anti-Sales Protection
    const salesKeywords = [
        'sell', 'selling', 'for sale', 'buy', 'buying', 'purchase', 'price', 'cost', 'available for sale', 'discount', 'offer', 'best price',
        'swap', 'swapping', 'exchange', 'trading', 'trade', 'account swap', 'account trade', 'account exchange',
        'who wants to buy?', 'i\'m selling my account', 'dm me to buy', 'looking to sell', 'account for sale', 'who wants to swap?', 'exchange offer', 'willing to trade', 'selling cheap'
    ];

    const salesRegex = new RegExp(salesKeywords.join('|'), 'i');
    if (salesRegex.test(msgText) && !isAdmin && !isBotOwner) {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('🚫 Sales and swaps are not allowed in this group.') });
        await sock.sendMessage(chatId, { delete: { id: message.key.id, remoteJid: chatId, fromMe: false } });
        await warnUser(sock, chatId, sender, 'Posted a sales or swap message');
        return;
    }
};

module.exports.startBot = async (sock) => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const authState = await retrieveAuthState(botNumber);

    if (authState) {
        state.creds = authState;
    }

    sock.ev.on('creds.update', async (creds) => {
        await storeAuthState(botNumber, creds);
        await saveCreds();
    });

    sock.ev.on('messages.upsert', async (m) => {
        console.log('📩 New message upsert:', m);
        await handleIncomingMessages(sock, m);
    });

    sock.ev.on('group-participants.update', async (update) => {
        console.log('👥 Group participants update:', update);
        const chat = await sock.groupMetadata(update.id);
        const contact = update.participants[0];
        const user = contact.split('@')[0];
        const { data: groupSettings, error } = await supabase
            .from('group_settings')
            .select('welcome_messages_enabled')
            .eq('group_id', update.id)
            .single();

        if (update.action === 'add' && groupSettings && groupSettings.welcome_messages_enabled) {
            await sock.sendMessage(chat.id, { text: formatResponseWithHeaderFooter(welcomeMessage(user)) });
            console.log(`👋 Sent welcome message to ${user}`);
        }
    });

    // Schedule task to repost the shared link every 2 hours
    cron.schedule('0 */2 * * *', async () => {
        const chatId = 'YOUR_GROUP_CHAT_ID'; // Replace with your group chat ID
        const sharedLink = 'YOUR_SHARED_LINK'; // Replace with the link you want to share
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`🔗 Check out this link: ${sharedLink}`) });
        console.log('🔄 Reposted the shared link.');
    });

    console.log('✅ Bot is ready and listening for messages.');
};