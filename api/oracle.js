import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // We are switching to 'gemini-1.5-flash-latest' which is the most reliable production string
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const userPrompt = req.body.prompt || "Wake up.";
    
    const result = await model.generateContent(`
      Act as a corrupted digital oracle for the song "White Bronco". 
      Aesthetic: Digital Mysticism, paranoid, fragmented.
      Constraint: One cryptic sentence.
      User says: ${userPrompt}
    `);
    
    const response = await result.response;
    return res.status(200).json({ reply: response.text() });

  } catch (error) {
    // If THIS fails, we try the backup 'gemini-pro'
    return res.status(500).json({ reply: `SYSTEM_FAILURE: ${error.message}` });
  }
}
