import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function listModels() {
    if (!API_KEY) {
        console.error("VITE_GEMINI_API_KEY not found in .env");
        return;
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            data.models.forEach(m => {
                console.log(m.name.replace('models/', ''));
            });
        } else {
            console.log("No models found.");
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
