const fs = require('fs');
let code = fs.readFileSync('server/whatsapp.ts', 'utf8');

code = code.replace(/errorText: "⚠️ Masukkan teks atau balas pesan yang ingin diterjemahkan! Contoh: `\/tr en halo`" /g, 'errorText: "⚠️ Please provide text or reply to a message to translate! Example: `/tr en hello`" ');
code = code.replace(/errorText: "⚠️ Silakan balas gambar \(reply\) atau kirim gambar baru disertai pesan `\/ocr`!" /g, 'errorText: "⚠️ Please reply to an image or send a new image with the `/ocr` command!" ');
code = code.replace(/errorText: "⚠️ Please provide text for the meme sticker! Example: `\/qr hello`" /g, 'errorText: "⚠️ Please provide text for the meme sticker! Example: `/sg Hello World`" ');

fs.writeFileSync('server/whatsapp.ts', code);
