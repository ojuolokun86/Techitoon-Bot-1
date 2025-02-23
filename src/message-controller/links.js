const fs = require("fs");
const savedLinksFile = "./saved_links.json";
const supabase = require('../supabaseClient');
const { formatResponseWithHeaderFooter } = require('../utils/utils');

// Save a link
const saveLink = async (sock, chatId, sender, args) => {
    if (args.length < 3) {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Usage: .savelink TITLE LINK NOTE') });
        return;
    }

    const title = args[0];
    const link = args[1];
    const note = args.slice(2).join(" ");

    let savedLinks = {};
    if (fs.existsSync(savedLinksFile)) {
        savedLinks = JSON.parse(fs.readFileSync(savedLinksFile));
    }

    savedLinks[title] = { link, note, addedBy: sender };

    fs.writeFileSync(savedLinksFile, JSON.stringify(savedLinks, null, 2));
    
    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`✅ Link saved!\n\n📌 *Title:* ${title}\n🔗 *Link:* ${link}\n📝 *Note:* ${note}`) });
};

// Share a saved link
const shareLink = async (sock, chatId, args) => {
    if (!fs.existsSync(savedLinksFile)) {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('❌ No saved links found.') });
        return;
    }

    const savedLinks = JSON.parse(fs.readFileSync(savedLinksFile));

    if (args.length === 0) {
        // Show all saved links
        let message = "📂 *Saved Links:*\n\n";
        for (const title in savedLinks) {
            message += `📌 *${title}*\n🔗 ${savedLinks[title].link}\n📝 ${savedLinks[title].note}\n\n`;
        }
        await sock.sendMessage(chatId, { text: message });
        return;
    }

    const title = args[0];

    if (!savedLinks[title]) {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`❌ No link found for "${title}".`) });
        return;
    }

    const { link, note } = savedLinks[title];

    await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`📌 *${title}*\n🔗 ${link}\n📝 ${note}`) });
};

// Delete a saved link
const deleteLink = async (sock, chatId, title) => {
    const { error } = await supabase
        .from('links')
        .delete()
        .eq('title', title);

    if (error) {
        console.error('Error deleting link:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error deleting link.') });
    } else {
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`✅ Link "${title}" deleted successfully.`) });
    }
};

// List all saved links
const listLinks = async (sock, chatId) => {
    const { data, error } = await supabase
        .from('links')
        .select('title, link');

    if (error || !data) {
        console.error('Error fetching links:', error);
        await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('⚠️ Error fetching links.') });
    } else {
        if (data.length === 0) {
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter('No links found.') });
        } else {
            const linksText = data.map(link => `🔗 ${link.title}: ${link.link}`).join('\n');
            await sock.sendMessage(chatId, { text: formatResponseWithHeaderFooter(`📄 Saved Links:\n\n${linksText}`) });
        }
    }
};

// Get saved links for a group
const getSavedLinks = async (chatId) => {
    try {
        const { data, error } = await supabase
            .from('saved_links')
            .select('url')
            .eq('group_id', chatId);

        if (error) {
            console.error('Error fetching saved links:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('Error fetching saved links:', error);
        return [];
    }
};

module.exports = { saveLink, shareLink, deleteLink, listLinks, getSavedLinks };