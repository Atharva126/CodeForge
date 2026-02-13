import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function testQuota() {
    if (!API_KEY) {
        console.error("VITE_GEMINI_API_KEY not found in .env");
        return;
    }

    // Fetch target list of models from API first to be sure
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
        const listResp = await fetch(listUrl);
        const listData = await listResp.json();

        if (!listData.models) {
            console.error("Could not fetch model list:", listData);
            return;
        }

        console.log(`Found ${listData.models.length} models. testing for quota...`);

        const genAI = new GoogleGenerativeAI(API_KEY);

        for (const m of listData.models) {
            const modelName = m.name.replace('models/', '');

            // Skip models that don't support generateContent
            if (!m.supportedGenerationMethods.includes('generateContent')) continue;

            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Minimal test prompt
                const result = await model.generateContent("hi");
                const text = result.response.text();
                console.log(`✅ SUCCESS: ${modelName} is working and has quota.`);
            } catch (err) {
                if (err.message.includes('429') || err.message.includes('Quota')) {
                    console.log(`❌ QUOTA EXCEEDED: ${modelName}`);
                } else if (err.message.includes('404')) {
                    console.log(`❌ NOT FOUND: ${modelName}`);
                } else {
                    console.log(`❌ ERROR on ${modelName}: ${err.message.split('\n')[0]}`);
                }
            }
        }
    } catch (error) {
        console.error("Critical Error:", error.message);
    }
}

testQuota();
