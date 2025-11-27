const fs = require('fs');
const path = require('path');

// --- CONFIG DATABASE USER ---
const userDbPath = path.join(__dirname, '../users.json');

// Fungsi Baca/Simpan Database User
const getUserDB = () => {
    if (!fs.existsSync(userDbPath)) fs.writeFileSync(userDbPath, JSON.stringify({}));
    try { return JSON.parse(fs.readFileSync(userDbPath)); } catch { return {}; }
};

const saveUserDB = (data) => fs.writeFileSync(userDbPath, JSON.stringify(data, null, 2));

// --- CONFIG FITUR ---
const TICKET_COST = 1; // Biaya buat 1 grup
const STARTING_TICKET = 3; // Tiket gratis untuk pengguna baru

module.exports = {
    meta: {
        command: 'creategroup',
        category: 'Premium Tools',
        description: 'Buat grup otomatis (Pakai Tiket)'
    },

    handle: async ({ sock, m, from, sender, senderNum, command, args, q, isOwner, getNum }) => {
        
        const users = getUserDB();

        // 1. INISIALISASI USER (Jika belum ada di database)
        if (!users[senderNum]) {
            users[senderNum] = { tickets: STARTING_TICKET, created: 0 };
            saveUserDB(users);
        }

        // ============================================================
        // 🎮 COMMAND 1: BUAT GRUP (.creategroup nama)
        // ============================================================
        if (command === 'creategroup') {
            if (!q) return m.reply(`⚠️ Format salah.\nContoh: *.creategroup Fanra Community*`);

            const user = users[senderNum];

            // Cek Tiket
            if (user.tickets < TICKET_COST) {
                return m.reply(`⛔ *Tiket Habis!*\nAnda butuh ${TICKET_COST} tiket untuk membuat grup.\nSisa tiket Anda: ${user.tickets}\n\nMinta Owner untuk isi ulang.`);
            }

            // Reaksi Loading
            await sock.sendMessage(from, { react: { text: "🔨", key: m.key } });

            try {
                // Proses Pembuatan Grup
                // Parameter: (Nama Grup, [Daftar Peserta Awal])
                const group = await sock.groupCreate(q, [sender]);
                
                // Kurangi Tiket
                user.tickets -= TICKET_COST;
                user.created += 1;
                saveUserDB(users);

                const text = `✅ *GRUP BERHASIL DIBUAT!*\n\n🏷️ Nama: ${q}\n🎫 Tiket Terpakai: 1\n🎫 Sisa Tiket: ${user.tickets}\n\n_Cek daftar chat Anda, grup baru sudah muncul._`;
                
                // Kirim Info
                await sock.sendMessage(from, { text: text }, { quoted: m });
                
                // Kirim Link Invite (Opsional, biar keren)
                // Tunggu sebentar biar grup ready
                setTimeout(async () => {
                    try {
                        const code = await sock.groupInviteCode(group.id);
                        await m.reply(`🔗 Link Grup: https://chat.whatsapp.com/${code}`);
                    } catch {}
                }, 3000);

            } catch (err) {
                console.log(err);
                m.reply('❌ Gagal membuat grup. Pastikan bot tidak diblokir/spam.');
            }
        }

        // ============================================================
        // 🎫 COMMAND 2: CEK TIKET (.myticket)
        // ============================================================
        if (command === 'myticket' || command === 'tiket') {
            const user = users[senderNum];
            const text = `🎫 *TIKET ANDA*\n\n👤 User: @${senderNum}\n🎟️ Saldo: *${user.tickets} Tiket*\n🔨 Grup Dibuat: ${user.created}`;
            m.reply(text);
        }

        // ============================================================
        // 👑 COMMAND 3: TAMBAH TIKET (OWNER ONLY) (.addticket @tag jumlah)
        // ============================================================
        if (command === 'addticket') {
            if (!isOwner) return m.reply('⚠️ Khusus Owner!');

            // Ambil target user (dari mention atau text)
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const targetNum = mentioned ? getNum(mentioned) : args[0];
            const amount = parseInt(args[1]);

            if (!targetNum || isNaN(amount)) {
                return m.reply('⚠️ Format: .addticket @tag [jumlah]\nContoh: .addticket @fanra 10');
            }

            // Pastikan user ada di DB
            if (!users[targetNum]) {
                users[targetNum] = { tickets: STARTING_TICKET, created: 0 };
            }

            // Tambah Tiket
            users[targetNum].tickets += amount;
            saveUserDB(users);

            m.reply(`✅ Berhasil menambah *${amount} Tiket* ke @${targetNum}.\nTotal Tiket dia sekarang: ${users[targetNum].tickets}`);
        }
    }
};