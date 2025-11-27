const fs = require('fs');
const path = require('path');

// DB
const dbPath = path.join(__dirname, '../database.json');
const getDB = () => {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
    try { return JSON.parse(fs.readFileSync(dbPath)); } catch { return {}; }
};
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

const LIMIT_KICK = 5;
const RESET_TIME = 86400000; // 24 jam (milidetik)
const spamData = {}; // per hari
const SUSPICIOUS_LINK = /chat\.whatsapp\.com|wa\.me\//i;
const LINK_REGEX = /https?:\/\/[^\s]+/gi;
const SAFE_LINKS = [
    /youtube\.com/i, /youtu\.be/i,
    /tiktok\.com/i,
    /instagram\.com/i,
    /discord\.gg/i, /discord\.com\/invite/i,
    /facebook\.com/i, /fb\.watch/i,
    /twitter\.com/i, /x\.com/i
];

// Fungsi cek link aman
const isSafeLink = link => SAFE_LINKS.some(re => re.test(link));
// Fungsi cek ada tag admin di message
const isTagAdmin = (mentionedJid, adminJids) => mentionedJid && mentionedJid.some(j => adminJids.includes(j));

module.exports = {
    meta: {
        command: 'antilink',
        category: 'Security',
        description: '[OTOMATIS AKTIF] Proteksi link mencurigakan & spam, kecuali link tertentu dengan tag admin.'
    },

    handle: async ({ sock, m, from, sender, senderNum, body, mentionedJid=[], isGroup, getNum }) => {
        if (!isGroup) return;

        // Cek ada link
        const links = (body.match(LINK_REGEX) || []);
        if (links.length === 0) return; // Tidak mengandung link sama sekali

        // Cek list admin group
        let groupMeta = {};
        let adminNums = [];
        let adminJids = [];
        try {
            groupMeta = await sock.groupMetadata(from);
            adminJids = groupMeta.participants.filter(p => p.admin).map(p => p.id);
            adminNums = adminJids.map(jid => getNum(jid));
        } catch(e) {}

        let suspicious = false;
        for (let link of links) {
            if (SUSPICIOUS_LINK.test(link)) suspicious = true;
        }

        // Jika link WA grup/wa.me -> sudahlah, langsung hapus (paling keras, bahkan tag admin = tetap hapus!)
        if (suspicious) {
            await sock.sendMessage(from, { 
                delete: { 
                    remoteJid: from, 
                    fromMe: false, 
                    id: m.key.id,
                    participant: m.key.participant || m.key.remoteJid 
                } 
            });
            // SPAM COUNTER
            const key = `${from}:${senderNum}`;
            const now = Date.now();
            if (!spamData[key]) spamData[key] = { count: 0, last: now };
            if (now - spamData[key].last > RESET_TIME) spamData[key].count = 0;
            spamData[key].count++;
            spamData[key].last = now;
            if (spamData[key].count >= LIMIT_KICK) {
                setTimeout(() => sock.groupParticipantsUpdate(from, [sender], "remove"), 1500);
                delete spamData[key];
            }
            return;
        }

        // PERIKSA SEMUA LINK, APA SEMUA LINK SAFE, ATAU ADA YG BUKAN SAFE?
        let onlySafe = true;
        for (let link of links) {
            if (!isSafeLink(link)) onlySafe = false;
        }

        // Jika ada link yg bukan link aman
        if (!onlySafe) {
            // Harus tag admin, kalau gak tag admin maka hapus pesan
            if (!isTagAdmin(mentionedJid, adminJids)) {
                await sock.sendMessage(from, { 
                    delete: { 
                        remoteJid: from, 
                        fromMe: false, 
                        id: m.key.id,
                        participant: m.key.participant || m.key.remoteJid 
                    } 
                });
                // SPAM COUNTER
                const key = `${from}:${senderNum}`;
                const now = Date.now();
                if (!spamData[key]) spamData[key] = { count: 0, last: now };
                if (now - spamData[key].last > RESET_TIME) spamData[key].count = 0;
                spamData[key].count++;
                spamData[key].last = now;
                if (spamData[key].count >= LIMIT_KICK) {
                    setTimeout(() => sock.groupParticipantsUpdate(from, [sender], "remove"), 1500);
                    delete spamData[key];
                }
                return;
            }
        }
        // Jika semua link aman, tidak perlu dihapus
        // Namun kalau spam link aman, (misal spam yt) TETAP hitung spam, jika lebih dari LIMIT_KICK = out!
        const key = `${from}:${senderNum}`;
        const now = Date.now();
        if (!spamData[key]) spamData[key] = { count: 0, last: now };
        if (now - spamData[key].last > RESET_TIME) spamData[key].count = 0;
        spamData[key].count++;
        spamData[key].last = now;
        if (spamData[key].count >= LIMIT_KICK) {
            setTimeout(() => sock.groupParticipantsUpdate(from, [sender], "remove"), 1500);
            delete spamData[key];
        }
        // Tidak hapus pesan karena link 100% aman & sudah ada tag admin (atau link aman tanpa batas)
    }
};