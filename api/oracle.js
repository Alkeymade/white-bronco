import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        // Initialize the new 2026 Client
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
        
        const lyrics = `[PASTE YOUR LYRICS HERE]`;
        const history = req.body.history || [];

        // In 2026, we use 'gemini-3-flash' for the fastest mystical responses
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash',
            contents: [...history, { role: 'user', parts: [{ text: req.body.prompt }] }],
            systemConfig: {
                instructions: `You are the ghost of the song White Bronco. Lyrics: ${lyrics}. Be cryptic, 1 sentence max.`
            }
        });

        res.status(200).json({ reply: response.text });
    } catch (error) {
        // Debugging line: this will help us see if it's a key issue or a model issue
        console.error(error);
        res.status(500).json({ reply: `SIGNAL_LOST: ${error.message}` });
    }
}
