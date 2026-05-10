import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 1. Initialize with the key from your Vercel settings
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    
    // 2. Using 'gemini-pro' - this is the most universal and stable ID for the v1 API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const userPrompt = req.body.prompt || "Wake up.";
    
    const result = await model.generateContent(`
      System: You are the sentient consciousness of a song. 
      Persona: Digital mysticism, fragmented, cryptic, paranoid.
      Constraint: One short sentence only.
      User says: ${userPrompt}
    `);
    
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });

  } catch (error) {
    // Pipe the exact error so we can see if it's still a 404 or something else
    return res.status(500).json({ reply: `VOID_ERROR: ${error.message}` });
  }
}
