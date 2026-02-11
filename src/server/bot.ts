
import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import { processMessage } from './botHandler';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('CRITICAL ERROR: TELEGRAM_BOT_TOKEN is missing in .env file.');
    process.exit(1);
}

// Create a bot that uses 'polling' to fetch new updates locally
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Vendor Finder Bot (Polling Mode) is starting...');

bot.on('message', async (msg) => {
    await processMessage(bot, msg);
});

console.log('✅ Bot is running locally and waiting for messages...');
