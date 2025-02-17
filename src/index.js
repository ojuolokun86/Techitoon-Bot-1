require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { startBot } = require('./bot');

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
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                start();
            }
        } else if (connection === 'open') {
            console.log('Techitoon Bot is ready!');
            startBot(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);
};

start();