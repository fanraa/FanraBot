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
const readline = require('readline');
const { messageHandler } = require('./handler');
const { logStyle } = require('./lib/color');

const usePairingCode = true; 
const sessionDir = './session';

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => { rl.question(text, (ans) => { resolve(ans); rl.close(); })});
};

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

    if (usePairingCode && !sock.authState.creds.me) {
        console.log('\n');
        const phoneNumber = await question('📞 Masukkan Nomor Bot (62xxx): ');
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber.trim());
                console.log(`\n🔑 KODE PAIRING: ${code?.match(/.{1,4}/g)?.join("-")}\n`);
            } catch {
                logStyle('Gagal meminta kode. Coba lagi.', 'error');
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
}

// Mencegah bot mati total jika ada error tak terduga
process.on('uncaughtException', function (err) {
    logStyle('Caught exception: ' + err, 'error');
});

startFanraBot();