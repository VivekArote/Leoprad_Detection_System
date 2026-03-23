import 'dotenv/config';
import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Telegraf } from 'telegraf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// project root because main.js is inside src
const ROOT_DIR = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'leopard_logs.json');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
console.log(BOT_TOKEN)

if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN missing in .env');
    process.exit(1);
}

if (!CHAT_ID) {
    console.error('❌ TELEGRAM_CHAT_ID missing in .env');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true });
}

bot.telegram.getMe()
    .then((me) => {
        console.log(`✅ Telegram bot connected: @${me.username}`);
    })
    .catch((err) => {
        console.error('❌ Telegram bot connection failed:', err.message);
    });

app.post('/detection', async (req, res) => {
    const newData = req.body;

    if (!newData || !newData.label) {
        return res.status(400).json({ error: 'Invalid detection data' });
    }

    console.log('📥 Detection received:', newData);

    // ----- Save logs -----
    let logs = [];

    if (existsSync(LOG_FILE)) {
        try {
            const content = readFileSync(LOG_FILE, 'utf8');
            if (content.trim()) {
                logs = JSON.parse(content);
            }
        } catch (err) {
            console.error('⚠️ Log file corrupted, resetting.');
            logs = [];
        }
    }

    logs.push(newData);
    writeFileSync(LOG_FILE, JSON.stringify(logs, null, 4));

    // ----- Resolve image path safely -----
    let resolvedImagePath = null;

    if (newData.image_path) {
        if (path.isAbsolute(newData.image_path)) {
            resolvedImagePath = newData.image_path;
        } else {
            resolvedImagePath = path.join(ROOT_DIR, newData.image_path);
        }
    }

    console.log('🖼 Original image_path:', newData.image_path);
    console.log('🖼 Resolved image_path:', resolvedImagePath);
    console.log('🖼 Image exists:', resolvedImagePath ? existsSync(resolvedImagePath) : false);

    const caption =
        `🐆 Leopard Detected\n` +
        `🏷️ Label: ${newData.label}\n` +
        `🎯 Confidence: ${(newData.confidence * 100).toFixed(1)}%\n` +
        `⏰ Time: ${newData.timestamp}`;

    try {
        if (resolvedImagePath && existsSync(resolvedImagePath)) {
            await bot.telegram.sendPhoto(
                CHAT_ID,
                { source: resolvedImagePath },
                { caption }
            );
            console.log('✅ Telegram photo sent');
        } else {
            await bot.telegram.sendMessage(CHAT_ID, caption);
            console.log('✅ Telegram text message sent');
        }
    } catch (err) {
        console.error('❌ Telegram error:', err.response?.description || err.message);
    }

    res.status(200).json({ message: 'Detection processed' });
});

app.get('/test-telegram', async (req, res) => {
    try {
        await bot.telegram.sendMessage(CHAT_ID, '✅ Test message from leopard detection server');
        res.send('Telegram test sent successfully');
    } catch (err) {
        console.error('❌ Test telegram failed:', err.response?.description || err.message);
        res.status(500).send(err.response?.description || err.message);
    }
});

app.listen(3000, () => {
    console.log('🚀 Commander Ready on http://localhost:3000');
});