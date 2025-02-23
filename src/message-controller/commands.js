const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');

// Add a command
async function addCommand(sock, chatId, command, response, accessLevel, functionName) {
    try {
        const { data, error } = await supabase
            .from('commands')
            .insert([{ command, response, access_level: accessLevel, function_name: functionName }]);

        if (error) {
            console.error('Error adding command:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error adding command.') });
        } else {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`✅ Command "${command}" added successfully!`) });
        }
    } catch (error) {
        console.error('Error adding command:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error adding command.') });
    }
}

// Delete a command
async function deleteCommand(sock, chatId, command) {
    try {
        const { data, error } = await supabase
            .from('commands')
            .delete()
            .eq('command', command);

        if (error) {
            console.error('Error deleting command:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error deleting command.') });
        } else {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`✅ Command "${command}" deleted successfully!`) });
        }
    } catch (error) {
        console.error('Error deleting command:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error deleting command.') });
    }
}

// Call a command
async function callCommand(sock, chatId, command) {
    try {
        const { data, error } = await supabase
            .from('commands')
            .select('*')
            .eq('command', command)
            .single();

        if (error) {
            console.error('Error fetching command:', error);
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Command not found.') });
        } else {
            const { response, function_name } = data;
            if (function_name) {
                // Call the function if it exists
                if (typeof global[function_name] === 'function') {
                    await global[function_name](sock, chatId, response);
                } else {
                    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`⚠️ Function "${function_name}" not found.`) });
                }
            } else {
                await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(response) });
            }
        }
    } catch (error) {
        console.error('Error fetching command:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error fetching command.') });
    }
}

module.exports = { addCommand, deleteCommand, callCommand };