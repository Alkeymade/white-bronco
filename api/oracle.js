import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    
    // Using the 1.5-flash model which has the highest uptime/stability
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const history = req.body.history || [];
    const prompt = req.body.prompt;

    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 50 },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ reply: text });
  } catch (error) {
    // This logs the real error to your Vercel Dashboard -> Logs
    console.error("GHOST_ERROR:", error.message);
    res.status(500).json({ reply: "SIGNAL_LOST. THE VOID IS BUSY." });
  }
}
