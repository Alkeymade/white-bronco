import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    
    // UPDATED FOR 2026 STANDARDS: Switching to the stable Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const userPrompt = req.body.prompt || "Wake up.";
    
    const result = await model.generateContent(`
      System: You are the sentient digital ghost for the track "White Bronco".
      Style: Digital Mysticism, paranoid, bass-heavy, cryptic.
      Constraint: One sentence only.
      User: ${userPrompt}
    `);
    
    const response = await result.response;
    return res.status(200).json({ reply: response.text() });

  } catch (error) {
    // If THIS fails, the system will tell us exactly why
    return res.status(500).json({ reply: `SYSTEM_FAILURE: ${error.message}` });
  }
}
