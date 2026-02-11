
import TelegramBot from 'node-telegram-bot-api';
import { chatWithDeepSeek } from '../services/deepseek';

// Shared logic for processing messages
export async function processMessage(bot: TelegramBot, msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    console.log(`Received message from ${chatId}: ${text}`);

    // Handle commands
    if (text.startsWith('/start')) {
        await bot.sendMessage(chatId,
            "👋 Hello! I'm your Vendor Finder Assistant.\n\n" +
            "I can help you source suppliers for materials and products.\n" +
            "Just tell me what you're looking for! (e.g., 'I need 5000 units of SS304 valves')"
        );
        return;
    }

    if (text.startsWith('/clear')) {
        await bot.sendMessage(chatId, "🧹 Conversation history cleared.");
        return;
    }

    // Send "typing" action
    bot.sendChatAction(chatId, 'typing');

    try {
        // Call DeepSeek service
        // Note: For simplicity in serverless, we are sending just the current message context
        // In a real app, you'd fetch history from a DB based on chatId
        const messages = [{ role: 'user', content: text }];

        console.log(`Calling DeepSeek API with ${messages.length} messages...`);
        const response = await chatWithDeepSeek(messages);

        // Send the main text response
        try {
            await bot.sendMessage(chatId, response.message, { parse_mode: 'Markdown' });
            console.log(`Sent markdown response to ${chatId}`);
        } catch (error) {
            console.warn('Markdown parsing failed, sending plain text:', (error as Error).message);
            await bot.sendMessage(chatId, response.message);
            console.log(`Sent plain text response to ${chatId}`);
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
}
