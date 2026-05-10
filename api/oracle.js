import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
    const history = req.body.history || [];

    // Using Gemini 3 Flash - the 2026 production standard
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: [...history, { role: 'user', parts: [{ text: req.body.prompt }] }],
      systemConfig: {
        instructions: "You are the ghost of the song White Bronco. Be cryptic, fragmented, and mystical. 1 sentence max."
      }
    });

    res.status(200).json({ reply: response.text });
  } catch (error) {
    res.status(500).json({ reply: "SIGNAL_LOST." });
  }
}
