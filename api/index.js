import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the client once outside the handler
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// This route handles /api/chat as defined in your vercel.json
app.post(['/api/chat', '/chat', '/'], async (req, res) => {
    const { messages } = req.body;
    
    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        // Use the modern 2.0+ streaming syntax
        const result = await ai.models.generateContentStream({
            model: "gemini-2.0-flash", // Most stable for March 2026
            contents: messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }))
        });

        // Iterate through the stream chunks
        for await (const chunk of result) {
            const chunkText = chunk.text; // Note: Use .text (property), not .text() (method) in new SDK
            if (chunkText) {
                res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error("Gemini Execution Error:", error);
        res.write(`data: ${JSON.stringify({ content: "⚠️ Error: " + error.message })}\n\n`);
        res.end();
    }
});

// Vercel requires the app to be the default export
export default app;