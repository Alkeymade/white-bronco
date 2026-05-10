import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
        const history = req.body.history || [];

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash',
            contents: [...history, { role: 'user', parts: [{ text: req.body.prompt }] }],
            // Ensures the "Ghost" isn't silenced by standard AI safety filters
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            systemConfig: {
                instructions: "You are the ghost of the song White Bronco. Your lyrics are a ritual. Be cryptic, fragmented, and use metaphors of engines, fog, and radio waves. Max 1 sentence."
            }
        });

        res.status(200).json({ reply: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "SIGNAL_LOST. THE STATIC IS TOO LOUD." });
    }
}
