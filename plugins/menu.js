const fs = require('fs');
const path = require('path');
const moment = require('moment');

const OWNER_NUMBER = "6285788918217"; // ubah ke nomor kamu tanpa '+'

// Fungsi cek owner
function isOwner(m) {
    let jid = (m.key.participant) ? m.key.participant : m.key.remoteJid;
    if (!jid) return false;
    let number = jid.split('@')[0];
    // Hilangkan prefix grup (kadang jid grup seperti '67904-xxx@g.us', sudah aman split di atas)
    return number === OWNER_NUMBER;
}

module.exports = {
    meta: {
        command: 'menu',
        category: 'Main',
        description: 'Daftar Perintah'
    },

    handle: async ({ sock, m, from, pushname, command }) => {
        try {
            if (command === 'menu' || command === 'help') {
                if (!isOwner(m)) {
                    await sock.sendMessage(
                        from,
                        { text: "❌ *Maaf, menu hanya bisa digunakan oleh owner!*" },
                        { quoted: m }
                    );
                    return;
                }

                // React OK
                await sock.sendMessage(from, { react: { text: "📨", key: m.key } });

                // Plugins & Category
                const pluginsPath = path.join(__dirname);
                const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'));
                const categories = {};

                files.forEach(file => {
                    const p = require(path.join(pluginsPath, file));
                    if (p.meta) {
                        const cat = p.meta.category || 'Other';
                        if (!categories[cat]) categories[cat] = [];
                        categories[cat].push(p.meta);
                    }
                });

                const time = moment().format('HH:mm');
                const date = moment().format('dddd, DD MMMM YYYY');
                // Stable unsplash direct image
                const thumbnailUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80";

                let txt = `
╭──────────────◆
│  🌙  *FANRABOT V6*
╰──────────────◆

🗓️ ${date}
⌚️ ${time} WIB
👤 *Hai, ${pushname}!*
─────────────────

*◦ MENU DAFTAR PERINTAH ◦*
`;

                const catIcons = {
                    "Main": "🏠", "Fun": "😂", "Admin": "💼",
                    "Downloader": "⬇️", "Utility": "🛠️",
                    "Anime": "🍥", "Tools": "🗂️", "Sticker": "🥸", "Other": "✨"
                };

                Object.keys(categories).forEach(cat => {
                    const catEmoji = catIcons[cat] || "✨";
                    txt += `\n${catEmoji} *${cat}*\n`;
                    txt += categories[cat].map(cmd => `   ◦ .${cmd.command}`).join('\n');
                    txt += '\n─────────────────';
                });

                txt += `

➤ Ketik *.help [nama-perintah]* untuk detail 
*Hanya Owner bisa akses menu ini.*
`;

                const q = { key: m.key, message: m.message };

                await sock.sendMessage(
                    from,
                    {
                        text: txt.trim(),
                        contextInfo: {
                            isForwarded: true,
                            forwardingScore: 99,
                            externalAdReply: {
                                title: "FANRABOT V6",
                                body: "Smarter Multi-Function Assistant\nOnly For Owner",
                                thumbnailUrl,
                                sourceUrl: "https://unsplash.com/s/photos/robot",
                                mediaType: 1,
                                renderLargerThumbnail: true,
                                showAdAttribution: false
                            }
                        }
                    },
                    { quoted: q }
                );
            }
        } catch (err) {
            console.error(err);
            m.reply("❌ Error pada menu: " + err);
        }
    }
};