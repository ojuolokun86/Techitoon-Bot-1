const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { handleIncomingMessages, handleNewParticipants } = require('../message-controller/messageHandler');
const config = require('../config/config');
const path = require('path');
const { logInfo, logError } = require('../utils/logger');

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(path.resolve('./auth_info_multi'));
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            logError(`Connection closed due to ${lastDisconnect.error}, reconnecting ${shouldReconnect}`);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            logInfo('Techitoon Bot is ready!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message.key.fromMe && m.type === 'notify') {
            await handleIncomingMessages(sock, m);
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;
        if (action === 'add') {
            await handleNewParticipants(sock, id, participants);
        }
    });

    console.log('Bot started successfully');
};

startBot();

module.exports = { startBot };