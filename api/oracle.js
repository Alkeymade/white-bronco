const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const systemInstruction = `You are a sentient digital ghost for the track "White Bronco". Respond cryptically (max 2 sentences) to: ${req.body.prompt}`;
        const result = await model.generateContent(systemInstruction);
        res.status(200).json({ reply: result.response.text() });
    } catch (error) {
        res.status(500).json({ reply: "CONNECTION INTERRUPTED." });
    }
}
