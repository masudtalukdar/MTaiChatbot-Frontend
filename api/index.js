import 'dotenv/config'; // Modern way to load .env
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Dynamic import for Gemini
async function getGeminiClient() {
    const { GoogleGenAI } = await import("@google/genai");
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

app.post(['/api/chat', '/chat'], async (req, res) => {
    const { messages } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const ai = await getGeminiClient();

        const response = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "You are MTaiChatbot. Use Google Search to provide current info."
            }
        });

        for await (const chunk of response) {
            const chunkText = chunk.text; 
            if (chunkText) {
                res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error("Gemini 3.1 Error:", error);
        res.write(`data: ${JSON.stringify({ content: "⚠️ Error: " + error.message })}\n\n`);
        res.end();
    }
});

// IMPORTANT: Use export default instead of module.exports
export default app;