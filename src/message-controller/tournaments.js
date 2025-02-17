const { formatResponse } = require('../utils/utils');

const startTournament = async (sock, chatId, args) => {
    // Implement start tournament logic here
    await sock.sendMessage(chatId, { text: formatResponse('🎮 Tournament started.') });
};

const endTournament = async (sock, chatId, args) => {
    // Implement end tournament logic here
    await sock.sendMessage(chatId, { text: formatResponse('🏁 Tournament ended.') });
};

const tournamentStatus = async (sock, chatId) => {
    // Implement tournament status logic here
    await sock.sendMessage(chatId, { text: formatResponse('🏅 Tournament status.') });
};

module.exports = {
    startTournament,
    endTournament,
    tournamentStatus,
};