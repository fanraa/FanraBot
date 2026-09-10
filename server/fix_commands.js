const fs = require('fs');
let code = fs.readFileSync('server/whatsapp.ts', 'utf8');

const regex = /const BACKEND_BUILTIN_COMMANDS = \[[\s\S]*?\];/;
const match = code.match(regex);

if (match) {
  let innerListStr = match[0];
  
  innerListStr = innerListStr.replace(/e\.g\., \)/g, 'e.g., `@user`)');
  innerListStr = innerListStr.replace(/Example: /g, 'Example: `');
  innerListStr = innerListStr.replace(/Hello World`/g, '/sg Hello World`');
  innerListStr = innerListStr.replace(/hello`/g, '/qr hello`');
  innerListStr = innerListStr.replace(/https:\/\/google\.com`/g, '/shorturl https://google.com`');
  innerListStr = innerListStr.replace(/fainted`/g, '/play fainted`');

  code = code.replace(regex, innerListStr);
  fs.writeFileSync('server/whatsapp.ts', code);
  console.log('Fixed backticks.');
}
