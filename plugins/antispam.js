const spamMap = {};

const SPAM_LIMIT_DELETE = 5;
const SPAM_LIMIT_KICK = 10;
const RESET_TIMER = 8000;

// Universal number extractor
function getNum(jid) {
    return jid ? jid.split('@')[0] : '';
}

module.exports = {
    meta: {
        command: 'antispam',
        category: 'Security',
        description: 'Auto Kick Spam (Fix Delete & Kick)'
    },

    handle: async ({ sock, m, from, sender, senderNum, body, isGroup }) => {
        if (!isGroup) return;
        if (!body) return;

        const botNum = getNum(sock.user.id);
        if (senderNum === botNum) return;

        // === FIX META ADMIN CHECK ===
        let isBotAdmin = false;
        try {
            const meta = await sock.groupMetadata(from);
            const admins = meta.participants.filter(p => p.admin);
            isBotAdmin = admins.some(a => a.id === sock.user.id);
        } catch (e) {
            console.log("Meta error:", e);
            return;
        }
        if (!isBotAdmin) return;

        // === SPAM DETECTOR ===
        const key = `${from}-${senderNum}`;
        if (!spamMap[key]) {
            spamMap[key] = {
                count: 1,
                lastMsg: body,
                timer: setTimeout(() => delete spamMap[key], RESET_TIMER)
            };
            return;
        }

        const userData = spamMap[key];

        if (body === userData.lastMsg) {
            userData.count++;
        } else {
            userData.count = 1;
            userData.lastMsg = body;
        }

        clearTimeout(userData.timer);
        userData.timer = setTimeout(() => delete spamMap[key], RESET_TIMER);

        // =============== FIX DELETE MESSAGE STRUCTURE ===================
        async function deleteMsg() {
            try {
                await sock.sendMessage(from, {
                    delete: {
                        remoteJid: from,
                        fromMe: m.key.fromMe,
                        id: m.key.id,
                        participant: m.key.participant || sender // FIX utama
                    }
                });
            } catch (e) {
                console.log("Delete error:", e);
            }
        }

        // ======================== ACTIONS ===============================
        if (userData.count === SPAM_LIMIT_DELETE) {
            await deleteMsg();
            await sock.sendMessage(from, {
                text: `⚠️ @${senderNum} stop spamming.`,
                mentions: [sender]
            });
        }

        if (userData.count > SPAM_LIMIT_DELETE && userData.count < SPAM_LIMIT_KICK) {
            await deleteMsg();
        }

        if (userData.count >= SPAM_LIMIT_KICK) {
            await deleteMsg();

            await sock.sendMessage(from, {
                text: `⛔ *SPAM DETECTED*\nUser: @${senderNum}\nAction: Removed.`,
                mentions: [sender]
            });

            // =============== FIX KICK (Baileys format baru) ===================
            setTimeout(async () => {
                try {
                    await sock.groupParticipantsUpdate(from, [sender], "remove");
                } catch (e) {
                    console.log("Kick error:", e);
                }
                delete spamMap[key];
            }, 1500);
        }
    }
};
