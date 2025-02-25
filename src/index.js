require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { logInfo, logError } = require('./utils/logger');
const { handleIncomingMessages } = require('./message-controller/messageHandler');
const { handleGroupParticipantsUpdate } = require('./message-controller/groupHandler');
const config = require('./config/config');
const supabase = require('./supabaseClient');

async function saveSuperadmin(groupId, userId) {
    await supabase
        .from('superadmins')
        .upsert([{ group_id: groupId, user_id: userId }]);
}

async function startSecurityBot(sock) {
    const myNumber = config.botOwnerId;

    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action, by } = update;
        const groupMetadata = await sock.groupMetadata(id);

        if (action === 'promote') {
            for (const participant of participants) {
                if (participant !== myNumber) {
                    try {
                        await sock.groupParticipantsUpdate(id, [participant], 'demote');
                        console.log(`❌ Removed admin rights from: ${participant}`);
                    } catch (err) {
                        console.log(`⚠️ Failed to demote ${participant}:`, err);
                    }
                } else {
                    await saveSuperadmin(id, participant);
                }
            }
        }

        if (action === 'remove' && participants.includes(myNumber)) {
            console.log('🚨 I was removed! Taking back control...');
            if (by) {
                try {
                    await sock.groupParticipantsUpdate(id, [by], 'remove');
                    console.log(`🔥 Banned ${by} for removing me.`);
                } catch (err) {
                    console.log(`❌ Failed to remove ${by}:`, err);
                }
            }
            await sock.groupParticipantsUpdate(id, [myNumber], 'add');
            await sock.groupParticipantsUpdate(id, [myNumber], 'promote');
            console.log(`✅ Restored as superadmin.`);
        }

        if (action === 'add') {
            for (const user of participants) {
                let { data, error } = await supabase
                    .from('superadmins')
                    .select('*')
                    .eq('group_id', id)
                    .eq('user_id', user);

                if (data && data.length > 0) {
                    // User was a superadmin before, restore admin rights
                    await sock.groupParticipantsUpdate(id, [user], 'promote');
                    await sock.sendMessage(id, { text: `✅ @${user.split('@')[0]} has been restored as superadmin!`, mentions: [user] });
                }
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        const sender = msg.key.participant || msg.key.remoteJid;
        const chatId = msg.key.remoteJid;
        const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (messageText === '.restoreme' && sender === myNumber) {
            console.log('🛠 Restoring superadmin rights manually...');
            await sock.groupParticipantsUpdate(chatId, [myNumber], 'promote');
            console.log(`✅ You are now superadmin again!`);
        }
    });
}

async function startBot(sock) {
    sock.ev.on('messages.upsert', async (m) => {
        console.log('📩 New message upsert:', m);
        await handleIncomingMessages(sock, m);
    });

    sock.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantsUpdate(sock, update);
    });

    console.log('✅ Bot is ready and listening for messages.');
}

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
            startSecurityBot(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);
};

start().catch(error => {
    logError(`❌ Error starting bot: ${error}`);
});