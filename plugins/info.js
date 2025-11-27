const os = require('os');

module.exports = {
    meta: { command: 'ping', category: 'Info', description: 'Cek status' },
    handle: async ({ m, command }) => {
        if (command === 'ping') {
            const start = Date.now();
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const mTime = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);
            // Info premium device (hostname, platform, RAM usage), emoji-style
            const used = process.memoryUsage();
            const totalmem = os.totalmem();
            const freemem = os.freemem();

            // One message, all info
            const msg =
`🏓 *Pong Premium!*
──────────────
📶 *Kecepatan*:  _${Date.now() - start}ms_
⏱️ *Runtime Bot*:  _${h}j ${mTime}m ${s}s_
💻 *Device*:  _${os.hostname()} [${os.platform()}]_
🧠 *RAM Used*:  ${(used.rss / 1024 / 1024).toFixed(1)}/${(totalmem / 1024 / 1024).toFixed(1)} MB
──────────────
🤖 Powered by FanraBot
`;

            // Hanya satu reply premium, tidak double
            await m.reply(msg);
        }

        if (command === 'runtime') {
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const mTime = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);

            await m.reply(
`⏱️ *Runtime Bot*
Aktif selama: *${h} Jam ${mTime} Menit ${s} Detik*
`);
        }
    }
};