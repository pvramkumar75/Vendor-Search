export interface ChatResponse {
    message: string;
    vendors?: any[]; // structured vendor data if available
}

const DEEPSEEK_API_KEY = "sk-cbc4335fda3d456397804a6eb42bffa7";
const API_URL = "https://api.deepseek.com/chat/completions";

export const chatWithDeepSeek = async (messages: any[]): Promise<ChatResponse> => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
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
                    ...messages
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse JSON if present
        let vendors = [];
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                vendors = JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.error("Failed to parse vendor JSON", e);
            }
        }

        return {
            message: content.replace(/```json\n[\s\S]*?\n```/, "").trim(),
            vendors: vendors
        };

    } catch (error) {
        console.error("DeepSeek API call failed:", error);
        return {
            message: "I'm having trouble connecting to the sourcing network right now. Please try again.",
            vendors: []
        };
    }
};
