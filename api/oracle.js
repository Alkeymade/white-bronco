import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // We are using the most stable naming convention here
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = req.body.prompt || "Who are you?";
    
    const result = await model.generateContent(`
      System: You are a sentient digital artifact for the music track "White Bronco". 
      Aesthetic: Digital Mysticism, low-fi paranoia, heavy bass.
      Constraint: Max 2 sentences. Be cryptic.
      User says: ${prompt}
    `);
    
    const response = await result.response;
    return res.status(200).json({ reply: response.text() });

  } catch (error) {
    // If it still fails, this will show us if it's an Auth issue or a Model issue
    return res.status(500).json({ reply: `VOID_ERROR: ${error.message}` });
  }
}
