const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');

const scheduleMessage = async (sock, chatId, args) => {
    const message = args.join(' ');
    const scheduledTime = new Date(args[0]); // Assuming the first argument is the time

    const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({ group_id: chatId, message, scheduled_time: scheduledTime });

    if (error) {
        console.error('Error scheduling message:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error scheduling message.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Message scheduled successfully.') });
    }
};

const remind = async (sock, chatId, args) => {
    const message = args.join(' ');
    const reminderTime = new Date(args[0]); // Assuming the first argument is the time

    const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({ group_id: chatId, message, scheduled_time: reminderTime });

    if (error) {
        console.error('Error setting reminder:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error setting reminder.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Reminder set successfully.') });
    }
};

const cancelSchedule = async (sock, chatId, args) => {
    const messageId = args[0]; // Assuming the first argument is the message ID

    const { error } = await supabase
        .from('scheduled_messages')
        .delete()
        .eq('id', messageId);

    if (error) {
        console.error('Error canceling schedule:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error canceling schedule.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Schedule canceled successfully.') });
    }
};

const cancelReminder = async (sock, chatId) => {
    const { error } = await supabase
        .from('scheduled_messages')
        .delete()
        .eq('group_id', chatId);

    if (error) {
        console.error('Error canceling reminder:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error canceling reminder.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('✅ Reminder canceled successfully.') });
    }
};

// Example implementation of scheduleAnnouncement
async function scheduleAnnouncement(sock, chatId, message) {
    // Your scheduling logic here
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`📅 Scheduled announcement: ${message}`) });
}

module.exports = { scheduleMessage, remind, cancelSchedule, cancelReminder, scheduleAnnouncement };