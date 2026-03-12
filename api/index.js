import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize AI outside the handler for better performance
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

app.post(['/api/chat', '/chat', '/'], async (req, res) => {
    const { messages } = req.body;
    
    // Crucial for Vercel Streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", // Use this stable version first to test
        });

        // Simple streaming logic
        const result = await model.generateContentStream({
            contents: messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }))
        });

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error("Vercel Runtime Error:", error);
        res.write(`data: ${JSON.stringify({ content: "⚠️ Server Error: " + error.message })}\n\n`);
        res.end();
    }
});

export default app;