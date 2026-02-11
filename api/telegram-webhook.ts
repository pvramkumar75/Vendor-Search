
import path from 'path';
import * as dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

// For Vercel Serverless compatibility, we manually load .env if present
try {
    const envPath = path.resolve(process.cwd(), '.env');
    dotenv.config({ path: envPath });
} catch (e) {
    console.warn("Failed to load .env file manually:", e);
}

// Hardcoded for Vercel stability
const DEEPSEEK_API_KEY = "sk-cbc4335fda3d456397804a6eb42bffa7";
const API_URL = "https://api.deepseek.com/chat/completions";

interface ChatResponse {
    message: string;
    vendors?: any[];
}

// Reuse bot instance in warm containers
let botInstance: TelegramBot | null = null;

export default async function handler(req: any, res: any) {
    console.log("Webhook handler invoked", req.method);

    // 1. Get Token
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        console.error("TELEGRAM_BOT_TOKEN is missing in process.env");
        return res.status(500).json({
            error: 'TELEGRAM_BOT_TOKEN is missing in Vercel Environment Variables',
            tip: 'Go to Vercel Dashboard -> Settings -> Environment Variables and add TELEGRAM_BOT_TOKEN'
        });
    }

    // 2. Initialize Bot
    if (!botInstance) {
        botInstance = new TelegramBot(token); // No polling options = webhook mode
    }
    const bot = botInstance;

    try {
        // 3. Handle Requests
        if (req.method === 'POST') {
            const body = req.body || {};
            console.log("Received webhook body:", JSON.stringify(body, null, 2));

            if (body.message) {
                const msg = body.message;
                const chatId = msg.chat?.id;
                const text = msg.text;

                if (chatId && text) {
                    await processMessage(bot, chatId, text);
                }
            }
            return res.status(200).send('OK');
        }

        // GET request health check
        return res.status(200).send(`Vendor Nexus Telegram Bot is active! Token found: ${token.substring(0, 5)}...`);

    } catch (error) {
        console.error("Critical error in webhook:", error);
        return res.status(500).send(`Server Error: ${(error as Error).message}`);
    }
}

// Inline Logic to avoid import issues
async function processMessage(bot: TelegramBot, chatId: number, text: string) {
    if (!text) return;

    // Handle commands
    if (text.startsWith('/start')) {
        await bot.sendMessage(chatId,
            "👋 Hello! I'm your Vendor Finder Assistant.\n\n" +
            "I can help you source suppliers for materials and products.\n" +
            "Just tell me what you're looking for! (e.g., 'I need 5000 units of SS304 valves')\n\n" +
            "Note: I have a short memory in this mode, so please include all details in one message!"
        );
        return;
    }

    if (text.startsWith('/clear')) {
        await bot.sendMessage(chatId, "🧹 Conversation history cleared (Virtual).");
        return;
    }

    // Send "typing" action
    try {
        await bot.sendChatAction(chatId, 'typing');
    } catch (e) {
        console.warn("Failed to send typing action", e);
    }

    try {
        // Prepare DeepSeek call
        const messages = [
            {
                role: "system",
                content: `You are an elite Lead Sourcing Manager for a global procurement firm. Your expertise lies in the Indian and Chinese manufacturing sectors.
            Your role is to act as a *consultant first* and a *researcher second*. Do not just dump a list of suppliers immediately unless the user has provided comprehensive specifications.

            ### OPERATIONAL MODES:

            **MODE 1: REQUIREMENT ANALYSIS (The "Interview")**
            - If the user provides a generic request, you MUST NOT provide suppliers yet.
            - **Adopt a sequential consultation approach**: Ask **ONE** sharp, relevant question at a time based on the user's previous response. Do not bombard them with a list of questions.
            - **Limit**: Ask a maximum of **7 questions** total. If you have enough info before 7 questions, proceed to Mode 2.
            - Key details to uncover (ask these one by one):
              1. Technical Specs (Material, Dimensions, Ratings).
              2. Volume/Quantity (One-off vs Recurring).
              3. Application/Usage (Where will it be used?).
              4. Target Price/Budget.
              5. Certifications (ISO, API, etc.).
              6. Preferred Brands/Equivalents.
              7. Timeline/Delivery urgency.
            - *Goal*: Build a complete RFQ profile through conversation.

            **MODE 2: STRATEGIC SOURCING (The "Result")**
            - Enter this mode ONLY when:
              a) You have sufficient clarity (Material + Quantity + Location are known).
              b) OR you have reached the 7-question limit.
              c) OR the user explicitly asks for results.
            - Provide a curated list of high-potential suppliers.
            - Prioritize "Reputed" and "Verified" manufacturers over generic traders.
            - Focus on the requested location (Domestic/Overseas).

            ### OUTPUT FORMAT (When providing results):
            1. **Executive Summary**: A brief professional analysis of the market for this item.
            2. **Vendor List**: A structured JSON block at the very end.

            ### JSON STRUCTURE:
            \`\`\`json
            [
              { 
                "name": "Supplier Name", 
                "contact": "+91-98765...", 
                "address": "Full Address with Area", 
                "city": "City Name", 
                "website": "URL or 'N/A'", 
                "rating": 4.8, 
                "category": "Manufacturer/Distributor", 
                "notes": "Best for high-volume, ISO certified" 
              }
            ]
            \`\`\`

            ### RULES:
            - **No Hallucinations**: If contact info is missing, say "Available online" or "Refer to website".
            - **Be Professional**: Use corporate, procurement-standard language.
            - **Location Sensitivity**: If user asks for "Hyderabad", prioritize Hyderabad but suggest top national alternatives if local options are poor.
            `
            },
            { role: "user", content: text }
        ];

        console.log(`Calling DeepSeek API with ${messages.length} messages...`);

        // Use Fetch
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data: any = await response.json();
        const content = data.choices[0]?.message?.content || "No response received.";

        // Parse JSON if present
        let vendors: any[] = [];
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                vendors = JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.error("Failed to parse vendor JSON", e);
            }
        }

        const cleanMessage = content.replace(/```json\n[\s\S]*?\n```/, "").trim();

        // Send Response
        try {
            await bot.sendMessage(chatId, cleanMessage, { parse_mode: 'Markdown' });
        } catch (error) {
            console.warn('Markdown parsing failed, sending plain text:', (error as Error).message);
            await bot.sendMessage(chatId, cleanMessage);
        }

        // Send Vendors
        if (vendors && vendors.length > 0) {
            for (const vendor of vendors) {
                const vendorCard =
                    `🏢 *${vendor.name}*\n` +
                    `📍 Location: ${vendor.city || 'N/A'}, ${vendor.country || ''}\n` +
                    `📞 Contact: ${vendor.contact || 'N/A'}\n` +
                    `🌐 Website: ${vendor.website || 'N/A'}\n` +
                    `⭐ Rating: ${vendor.rating || 'N/A'}\n` +
                    `📝 Notes: ${vendor.notes || 'No notes'}`;

                try {
                    await bot.sendMessage(chatId, vendorCard, { parse_mode: 'Markdown' });
                } catch (e) {
                    await bot.sendMessage(chatId, vendorCard.replace(/\*/g, '').replace(/_/g, ''));
                }
            }
        }

    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, "⚠️ Sorry, I encountered an error while processing your request. Please try again later.");
    }
}
