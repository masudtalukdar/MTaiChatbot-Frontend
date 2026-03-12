require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Dynamic import for ES Module compatibility in CommonJS
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

        // SDK FIX: Iterate directly over the response object, not response.stream
        const response = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
            config: {
                tools: [{ googleSearch: {} }], // Enables 2026 web access
                systemInstruction: "You are MTaiChatbot. Use Google Search to provide current info."
            }
        });

        // FIXED LOOP: Iterate over 'response' directly
        for await (const chunk of response) {
            // New SDK uses chunk.text instead of chunk.text()
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

module.exports = app;


