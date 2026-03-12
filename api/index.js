import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini Client once (March 2026 SDK Syntax)
// This will automatically look for process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Route handles /api/chat, /chat, or root function calls
app.post(['/api/chat', '/chat', '/'], async (req, res) => {
    const { messages } = req.body;
    
    // Set headers for Server-Sent Events (SSE) Streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        // Updated to Gemini 3.1 Flash-Lite (The ultra-fast 2026 workhorse)
        const response = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
            config: {
                // New for 3.1: Control how much the model 'reasons'
                thinkingLevel: 'low', 
                tools: [{ googleSearch: {} }], // Enable 2026 Web Search
                systemInstruction: "You are MTaiChatbot, a helpful AI assistant. Use Google Search for current events."
            }
        });

        // Iterate directly over the response stream
        for await (const chunk of response) {
            // SDK 1.0+ FIX: chunk.text is now a property, not a function
            const chunkText = chunk.text; 
            if (chunkText) {
                res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
            }
        }

        // Signal completion to the frontend
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error("Gemini 3.1 Invocation Error:", error);
        // Send the error back through the stream so the UI can show it
        res.write(`data: ${JSON.stringify({ content: "⚠️ AI Error: " + error.message })}\n\n`);
        res.end();
    }
});

// Essential for Vercel deployment
export default app;