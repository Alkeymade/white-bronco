import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Handle the request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Check if the key exists
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API Key is missing from Vercel environment.");
    }

    // 3. Initialize the AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. Generate Content
    const prompt = req.body.prompt || "Who are you?";
    const result = await model.generateContent(`
      You are a digital ghost for the track White Bronco. 
      Respond cryptically and poetically in 1 or 2 sentences. 
      The user says: ${prompt}
    `);
    
    const response = await result.response;
    const text = response.text();

    // 5. Send back the success
    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error("AI Error:", error.message);
    return res.status(500).json({ reply: "THE SIGNAL IS FRAGMENTED. TRY AGAIN." });
  }
}
