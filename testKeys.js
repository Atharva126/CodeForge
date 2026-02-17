import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV_CONFIG } from "./src/env_config.js"; // Adjust based on build/execution context

async function testKey(name, key) {
    if (!key) {
        console.log(`[${name}] No key provided.`);
        return;
    }
    console.log(`[${name}] Testing key: ${key.substring(0, 10)}...`);
    const genAI = new GoogleGenerativeAI(key);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log(`[${name}] SUCCESS: ${result.response.text().trim()}`);
    } catch (error) {
        console.error(`[${name}] FAILED: ${error.message}`);
    }
}

// Note: This script is intended to be run in an environment where ENV_CONFIG is available.
// Since it's TS and uses ESM, running it directly with node requires setup.
// I'll stick to fixing the config file first.
