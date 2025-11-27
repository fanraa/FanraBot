const { getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    messageHandler: async (sock, chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message) return;
        
        // Mencegah loop pesan dari bot sendiri (Baileys ID biasanya BAE5)
        if (m.key.id.startsWith('BAE5') && m.key.fromMe) return;

        // --- DECODE PENGIRIM ---
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        // Decode JID agar @lid terbaca sebagai nomor biasa
        let senderRaw = isGroup ? (m.key.participant || m.participant) : m.key.remoteJid;
        const sender = sock.decodeJid(senderRaw);

        if (!sender) return;

        const pushname = m.pushName || "User";

        // Deteksi Isi Pesan (Lebih Lengkap)
        const type = getContentType(m.message);
        let body = '';
        
        if (type === 'conversation') body = m.message.conversation;
        else if (type === 'imageMessage') body = m.message.imageMessage.caption || '';
        else if (type === 'videoMessage') body = m.message.videoMessage.caption || '';
        else if (type === 'extendedTextMessage') body = m.message.extendedTextMessage.text || '';
        
        // --- CCTV LOG (Monitor Terminal) ---
        // Ini akan memunculkan isi pesan di terminal agar kita tahu bot membacanya
        if (body) {
            console.log(`[MSG] Dari: ${sender.split('@')[0]} | Tipe: ${type} | Isi: ${body.substring(0, 20)}...`);
        }

        // Command Info
        const prefix = '.';
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';

        // Load Plugins
        const pluginsFolder = path.join(__dirname, 'plugins');
        const pluginFiles = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));

        for (const file of pluginFiles) {
            const plugin = require(path.join(pluginsFolder, file));
            if (plugin.handle) {
                try {
                    await plugin.handle({
                        sock, m, from, sender, body, command, isCmd, isGroup, pushname
                    });
                } catch (e) {
                    console.error(`Error Plugin ${file}:`, e);
                }
            }
        }
    }
};