import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Client (March 2026 SDK)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post(['/api/chat', '/chat', '/'], async (req, res) => {
    const { messages } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const response = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
            config: {
                // OPTIMAL 2026 SETTINGS
                thinkingLevel: 'high',    // Deep reasoning & multi-step planning
                temperature: 1.0,         // Recommended for Gemini 3 series logic
                tools: [{ googleSearch: {} }], // Live 2026 web grounding
                systemInstruction: "You are MTaiChatbot, an advanced reasoning assistant. " +
                                   "Use high-level thinking to provide verified, expert-level answers."
            }
        });

        for await (const chunk of response) {
            const chunkText = chunk.text; // SDK 1.0+ property syntax
            if (chunkText) {
                res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error("Gemini 3.1 High-Reasoning Error:", error);
        res.write(`data: ${JSON.stringify({ content: "⚠️ Error: " + error.message })}\n\n`);
        res.end();
    }
});

export default app;