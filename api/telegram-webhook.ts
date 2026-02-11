
import type { VercelRequest, VercelResponse } from '@vercel/node';
import TelegramBot from 'node-telegram-bot-api';
import { processMessage } from '../src/server/botHandler';

const token = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!token) {
        return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not found' });
    }

    const bot = new TelegramBot(token);

    if (req.method === 'POST') {
        const body = req.body;

        if (body.message) {
            try {
                await processMessage(bot, body.message);
            } catch (error) {
                console.error('Error processing webhook:', error);
            }
        }

        // Always return 200 to acknowledge receipt to Telegram
        return res.status(200).send('OK');
    }

    return res.status(200).send('Vendor Nexus Telegram Bot is active!');
}
