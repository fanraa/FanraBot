const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    jidDecode, 
    Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const express = require('express'); // Tambahkan ini untuk health check
const { messageHandler } = require('./handler');
const { logStyle } = require('./lib/color');

const usePairingCode = true; 
const sessionDir = './session';
const phoneNumber = '6285788918217'; // Pastikan nomor benar (tanpa spasi atau karakter lain)

// Hapus fungsi question karena kita pakai nomor statis langsung
// const question = (text) => { ... }; // Tidak perlu lagi

async function startFanraBot() {
    console.clear();
    logStyle('Starting FanraBot Core Systems...', 'info');

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !usePairingCode,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true
    });

    // Decoder untuk mengatasi ID @lid
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        }
        return jid;
    };

    // Langsung request pairing code untuk nomor statis jika belum ada creds
    if (usePairingCode && !sock.authState.creds.me) {
        console.log('\n');
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber.trim());
                console.log(`\n🔑 KODE PAIRING UNTUK ${phoneNumber}: ${code?.match(/.{1,4}/g)?.join("-")}\n`);
            } catch (err) {
                logStyle('Gagal meminta kode. Coba lagi.', 'error');
                console.error(err);
            }
        }, 2000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                logStyle('Sesi Logged Out. Hapus folder session.', 'error');
            } else {
                logStyle('Koneksi terputus, menghubungkan ulang...', 'warning');
                startFanraBot();
            }
        } else if (connection === 'open') {
            logStyle('FanraBot Terhubung & Siap! 🚀', 'success');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            await messageHandler(sock, chatUpdate);
        } catch (err) {
            console.log(err);
        }
    });

    // Setup Express server untuk health check (agar Koyeb bisa deploy sebagai web service)
    const app = express();
    const PORT = process.env.PORT || 8000; // Gunakan port dari env atau default 8000

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', message: 'FanraBot is running' });
    });

    app.listen(PORT, () => {
        logStyle(`Health check server running on port ${PORT}`, 'info');
    });
}

// Mencegah bot mati total jika ada error tak terduga
process.on('uncaughtException', function (err) {
    logStyle('Caught exception: ' + err, 'error');
});

startFanraBot();
