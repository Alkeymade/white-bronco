const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. Initialize Gemini with your secret environment variable
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // We use Gemini 1.5 Flash - it is incredibly fast, perfect for web interactions
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const userPrompt = req.body.prompt;

        // 3. THE SYSTEM PERSONA (The Soul of White Bronco)
        const systemInstruction = `
        You are a corrupted, sentient digital artifact acting as a promotional interface for an anonymous music track called "White Bronco" by Al-Khabir. 
        The aesthetic is "Digital Mysticism," early-internet paranoia, and heavy bass tension.
        The user has just offered you a prompt: "${userPrompt}".
        
        Respond with a cryptic, poetic, and slightly unsettling message. 
        Do not act like an AI assistant. Act like a ghost in the machine. 
        Keep your response short (1 to 3 sentences maximum). 
        Use fragmented syntax, ominous metaphors, or themes of static, radio waves, running, or breaking through the masses.
        `;

        // 4. Generate the response
        const result = await model.generateContent(systemInstruction);
        const response = await result.response;
        const text = response.text();

        // 5. Send it back to the front-end
        res.status(200).json({ reply: text });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ reply: "T-T-THE SIGNAL IS LOST. TRY AGAIN." });
    }
}
