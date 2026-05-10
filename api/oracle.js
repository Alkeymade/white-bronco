import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
        const history = req.body.history || [];

        // We're using 'gemini-1.5-flash' here as it's the most compatible stable endpoint
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash', 
            contents: [...history, { role: 'user', parts: [{ text: req.body.prompt }] }],
            systemConfig: {
                instructions: "You are the ghost of White Bronco. Cryptic, 1 sentence."
            }
        });

        res.status(200).json({ reply: response.text });
    } catch (error) {
        // THIS LINE IS THE KEY: It will show us the REAL error in the chat box
        res.status(500).json({ reply: `VOID_ERROR: ${error.message}` });
    }
}
