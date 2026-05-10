import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
        const history = req.body.history || [];

        // Using the absolute model path to resolve the 404/v1beta issue
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [...history, { role: 'user', parts: [{ text: req.body.prompt }] }],
            systemConfig: {
                instructions: "You are the ghost of White Bronco. Cryptic, 1 sentence. METAPHORS: engine, fog, speed."
            }
        });

        res.status(200).json({ reply: response.text });
    } catch (error) {
        // If it fails again, try the backup string: 'gemini-1.5-flash-latest'
        console.error("AI Error:", error);
        res.status(500).json({ reply: `VOID_ERROR: ${error.message}` });
    }
}
