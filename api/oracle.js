import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(`Respond as a digital ghost to: ${req.body.prompt}`);
    const response = await result.response;
    return res.status(200).json({ reply: response.text() });

  } catch (error) {
    // This line is the key—it will show the actual reason for the failure
    return res.status(500).json({ reply: `VOID_ERROR: ${error.message}` });
  }
}
