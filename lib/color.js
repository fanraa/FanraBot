const chalk = require('chalk');

const logStyle = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    switch (type) {
        case 'info': console.log(chalk.cyan(`[${time}] ℹ️  ${text}`)); break;
        case 'success': console.log(chalk.green(`[${time}] ✅ ${text}`)); break;
        case 'error': console.log(chalk.red(`[${time}] ❌ ${text}`)); break;
        case 'warning': console.log(chalk.yellow(`[${time}] ⚠️  ${text}`)); break;
        case 'cmd': console.log(chalk.magenta(`[${time}] 🎮 ${text}`)); break;
        default: console.log(text);
    }
};

module.exports = { logStyle };