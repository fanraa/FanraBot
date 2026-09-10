const fs = require('fs');
let code = fs.readFileSync('server/whatsapp.ts', 'utf8');

const regex = /const BACKEND_BUILTIN_COMMANDS = \[[\s\S]*?\];/;
const match = code.match(regex);

if (match) {
  let innerListStr = match[0];
  
  innerListStr = innerListStr.replace(/e\.g\., \)/g, 'e.g., `@user`)');
  // First, completely fix the errorText strings
  
  const replacements = [
    [/errorText: "⚠️ Please send or reply to an image\/video to create a sticker!"/g, 'errorText: "⚠️ Please send or reply to an image/video to create a sticker!"'],
    [/errorText: "⚠️ Please provide text for the meme sticker! Example: `\/sg Hello World`"/g, 'errorText: "⚠️ Please provide text for the meme sticker! Example: `/sg Hello World`"'],
    [/errorText: "⚠️ Please reply to a sticker you want to convert to an image!"/g, 'errorText: "⚠️ Please reply to a sticker you want to convert to an image!"'],
    [/errorText: "⚠️ Please send or reply to an image to enhance its quality!"/g, 'errorText: "⚠️ Please send or reply to an image to enhance its quality!"'],
    [/errorText: "⚠️ Please provide a keyword or song URL to play! Example: `\/play fainted`"/g, 'errorText: "⚠️ Please provide a keyword or song URL to play! Example: `/play fainted`"'],
    [/errorText: "⚠️ Please provide text or an URL to generate a QR code\. Example: `\/qr hello`"/g, 'errorText: "⚠️ Please provide text or a URL to generate a QR code. Example: `/qr hello`"'],
    [/errorText: "⚠️ Please provide a URL to shorten\. Example: `\/shorturl(.*?)`"/g, 'errorText: "⚠️ Please provide a URL to shorten. Example: `/shorturl https://google.com`"']
  ];

  for (const [r, s] of replacements) {
    innerListStr = innerListStr.replace(r, s);
  }

  code = code.replace(regex, innerListStr);
  fs.writeFileSync('server/whatsapp.ts', code);
  console.log('Fixed backticks properly.');
} else {
  console.log('Not found');
}
