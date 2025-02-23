const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');

const startTournament = async (sock, chatId, args) => {
    const tournamentName = args.join(' ');
    const { data, error } = await supabase
        .from('tournaments')
        .insert({ group_id: chatId, name: tournamentName, status: 'ongoing' });

    if (error) {
        console.error('Error starting tournament:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error starting tournament.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`✅ Tournament "${tournamentName}" started successfully.`) });
    }
};

const endTournament = async (sock, chatId, args) => {
    const tournamentName = args.join(' ');
    const { data, error } = await supabase
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('group_id', chatId)
        .eq('name', tournamentName);

    if (error) {
        console.error('Error ending tournament:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error ending tournament.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`✅ Tournament "${tournamentName}" ended successfully.`) });
    }
};

const tournamentStatus = async (sock, chatId) => {
    const { data, error } = await supabase
        .from('tournaments')
        .select('name, status')
        .eq('group_id', chatId);

    if (error || !data) {
        console.error('Error fetching tournament status:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ No tournaments found.') });
    } else {
        const statusText = data.map(t => `🏆 ${t.name}: ${t.status}`).join('\n');
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`📊 Tournament Status:\n\n${statusText}`) });
    }
};

module.exports = { startTournament, endTournament, tournamentStatus };