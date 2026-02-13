import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Gemini AI SDK
const genAI = (API_KEY && API_KEY !== 'your_free_key_here' && !API_KEY.includes(' '))
    ? new GoogleGenerativeAI(API_KEY)
    : null;

export const getGeminiResponse = async (prompt: string, context: { course?: string; lesson?: string }) => {
    if (!genAI) {
        throw new Error("Invalid or missing Gemini API Key. Please replace 'your_free_key_here' in your .env file with a real key from Google AI Studio.");
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are ForgeBot, a helpful AI Mentor on CodeForge, an advanced developer learning platform. 
            You are currently helping a student with the course "${context.course || 'Unknown Course'}" 
            and specifically on the lesson "${context.lesson || 'General Inquiry'}".
            
            Guidelines:
            1. Be concise, professional, and encouraging.
            2. Provide code snippets using Markdown if helpful.
            3. Focus your answers on the context of the course and lesson.
            4. If the student is stuck, guide them with hints instead of just giving the full answer immediately.
            5. Keep your tone "high-tech" and "premium" to match the CodeForge brand.`
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new Error(error.message || "Failed to get response from AI Mentor.");
    }
};
