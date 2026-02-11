
import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import { chatWithDeepSeek } from '../services/deepseek';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('CRITICAL ERROR: TELEGRAM_BOT_TOKEN is missing in .env file.');
    console.error('Please create a .env file in the root directory and add:');
    console.error('TELEGRAM_BOT_TOKEN=your_token_here');
    process.exit(1);
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Store chat history in memory (simple implementation)
// In a real production app, use a database (Redis/Postgres)
interface ChatSession {
    messages: { role: string; content: string }[];
}

const sessions: Record<number, ChatSession> = {};

console.log('🤖 Vendor Finder Bot is starting...');

bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    console.log(`Received message from ${chatId}: ${text}`);

    // Initialize session if not exists
    if (!sessions[chatId]) {
        sessions[chatId] = { messages: [] };
    }

    const session = sessions[chatId];

    // Handle commands
    if (text.startsWith('/start')) {
        session.messages = [];
        await bot.sendMessage(chatId,
            "👋 Hello! I'm your Vendor Finder Assistant.\n\n" +
            "I can help you source suppliers for materials and products.\n" +
            "Just tell me what you're looking for! (e.g., 'I need 5000 units of SS304 valves')"
        );
        return;
    }

    if (text.startsWith('/clear')) {
        session.messages = [];
        await bot.sendMessage(chatId, "🧹 Conversation history cleared.");
        return;
    }

    // Add user message to history
    session.messages.push({ role: 'user', content: text });

    // Send "typing" action
    bot.sendChatAction(chatId, 'typing');

    try {
        // Call DeepSeek service
        // Note: chatWithDeepSeek expects the full conversation history
        const response = await chatWithDeepSeek(session.messages);

        // Add assistant response to history
        session.messages.push({ role: 'assistant', content: response.message });

        // Send the main text response
        try {
            await bot.sendMessage(chatId, response.message, { parse_mode: 'Markdown' });
        } catch (error) {
            // Fallback to plain text if Markdown parsing fails (common with special chars)
            console.warn('Markdown parsing failed, sending plain text:', (error as Error).message);
            await bot.sendMessage(chatId, response.message);
        }

        // If vendors are found, send them as a structured list
        if (response.vendors && response.vendors.length > 0) {
            for (const vendor of response.vendors) {
                const vendorCard =
                    `🏢 *${vendor.name}*\n` +
                    `📍 Location: ${vendor.city || 'N/A'}, ${vendor.country || ''}\n` +
                    `📞 Contact: ${vendor.contact || 'N/A'}\n` +
                    `🌐 Website: ${vendor.website || 'N/A'}\n` +
                    `⭐ Rating: ${vendor.rating || 'N/A'}\n` +
                    `📝 Notes: ${vendor.notes || 'No notes'}`;

                await bot.sendMessage(chatId, vendorCard, { parse_mode: 'Markdown' });
            }
        }

    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, "⚠️ Sorry, I encountered an error while processing your request. Please try again later.");
    }
});

console.log('✅ Bot is running and waiting for messages...');
