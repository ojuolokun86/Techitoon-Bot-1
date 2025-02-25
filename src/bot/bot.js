const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { handleIncomingMessages } = require('../message-controller/messageHandler');
const { handleGroupParticipantsUpdate } = require('../message-controller/groupHandler');
const { logInfo, logError } = require('../utils/logger');

const startBot = async (sock) => {
    sock.ev.on('messages.upsert', async (m) => {
        console.log('📩 New message upsert:', m);
        await handleIncomingMessages(sock, m);
    });

    sock.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantsUpdate(sock, update);
    });

    console.log('✅ Bot is ready and listening for messages.');
};

const start = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            logError(`Connection closed due to ${lastDisconnect.error}, reconnecting ${shouldReconnect}`);
            if (shouldReconnect) {
                start();
            }
        } else if (connection === 'open') {
            logInfo('Techitoon Bot is ready!');
            startBot(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);
};

start().catch(error => {
    logError(`❌ Error starting bot: ${error}`);
});

module.exports = { start, startBot };