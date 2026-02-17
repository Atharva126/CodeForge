import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV_CONFIG } from "../env_config";
import { sarvamService } from "./sarvamService";
import { groqService } from "./groqService";

/**
 * HYBRID AI SERVICE
 * Automatically selects the best available AI engine based on environmental credentials.
 */

const getKeys = () => {
    // Separate detection for general and interview keys
    let gemini = ENV_CONFIG.VITE_GEMINI_API_KEY;
    let interview = ENV_CONFIG.VITE_INTERVIEW_API_KEY;
    let grok = ENV_CONFIG.VITE_GROK_API_KEY;

    // Fallback to import.meta.env
    if (!gemini || gemini.length < 10) gemini = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
    if (!interview || interview.length < 10) interview = (import.meta.env.VITE_INTERVIEW_API_KEY || "").trim();
    if (!grok || grok.length < 10) grok = (import.meta.env.VITE_GROK_API_KEY || "").trim();

    return {
        gemini: (gemini && gemini.length > 10 && !gemini.includes('your_')) ? gemini.trim() : null,
        interview: (interview && interview.length > 10 && !interview.includes('your_')) ? interview.trim() : null,
        grok: (grok && grok.length > 10 && !grok.includes('your_')) ? grok.trim() : null
    };
};

// Standardized list of models to try. 
const GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro"
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * UNIFIED GEMINI EXECUTOR WITH KEY FAILOVER
 */
async function executeGeminiRequest(
    prompt: string,
    systemInstruction: string,
    isJson: boolean = false
): Promise<any> {
    const { interview, gemini, grok } = getKeys();
    const keysToTry = [interview, gemini].filter(k => k !== null) as string[];

    if (keysToTry.length === 0) {
        if (grok) return await callGrok(prompt, "AI Assistant", "general");
        throw new Error("AI_LINK_OFFLINE: NO_KEYS");
    }

    let lastError = "";

    for (const key of keysToTry) {
        const genAI = new GoogleGenerativeAI(key);
        const keyTag = `...${key.substring(key.length - 4)}`;

        for (const modelName of GEMINI_MODELS) {
            let attempts = 0;
            const maxAttempts = 1; // Faster failover for quota

            while (attempts <= maxAttempts) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: systemInstruction,
                        generationConfig: isJson ? { responseMimeType: "application/json" } : undefined
                    });

                    const result = await model.generateContent(prompt);
                    const text = result.response.text();
                    console.log(`✅ [AI SUCCESS] model: ${modelName} | key: ${keyTag}`);

                    if (isJson) {
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            console.error("JSON Parse Error:", text);
                            throw new Error("INVALID_JSON_RESPONSE");
                        }
                    }
                    return text;
                } catch (error: any) {
                    lastError = error.message || "Unknown error";

                    // IF we see "limit: 0", it means this model/key combo is strictly blocked (quota or region)
                    if (lastError.includes("limit: 0")) {
                        console.warn(`[Blocked] ${modelName} on key ${keyTag} has limit: 0. Trying next...`);
                        break;
                    }

                    // Handle Rate Limits (429)
                    if (lastError.includes("429") || lastError.includes("quota")) {
                        console.warn(`[Quota] ${modelName} on key ${keyTag} hit limit.`);
                        if (attempts < maxAttempts) {
                            console.log(`⏳ Waiting 2s before retry...`);
                            await delay(2000);
                            attempts++;
                            continue;
                        }
                        break; // Out of retries, try next model
                    }

                    // If it's a model not found error (404), skip immediately
                    if (lastError.includes("not found")) {
                        console.warn(`[404] ${modelName} not found on key ${keyTag}. Skip.`);
                        break;
                    }

                    // For key errors, move to next key
                    if (lastError.includes("key") || lastError.includes("API_KEY")) {
                        console.error(`[Key Error] Key ${keyTag} is invalid.`);
                        break;
                    }

                    // For other errors, move to next model
                    console.warn(`[AI WARN] ${modelName} failed: ${lastError}`);
                    break;
                }
            }
            // If it was a key error, break to next key
            if (lastError.includes("key") || lastError.includes("API_KEY")) break;
        }
    }

    // FINAL FALLBACK: Grok
    if (grok) {
        try {
            console.log("🚀 Switching to Grok fallback...");
            return await callGrok(prompt, "AI Assistant", "general");
        } catch (e) {
            console.error("Grok fallback failed.");
        }
    }

    throw new Error(`ALL_AI_SERVICES_EXHAUSTED: ${lastError}`);
}

// --- GROK ENGINE ---
const callGrok = async (prompt: string, role: string, phase: string) => {
    const { grok } = getKeys();
    if (!grok) throw new Error("GROK_KEY_MISSING");

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${grok}`
        },
        body: JSON.stringify({
            messages: [
                { role: "system", content: `You are a helpful assistant. Role: ${role}. Phase: ${phase}.` },
                { role: "user", content: prompt }
            ],
            model: "grok-beta",
            stream: false,
            temperature: 0.7
        })
    });

    if (!response.ok) throw new Error("GROK_FETCH_FAILED");
    const data = await response.json();
    return data.choices[0].message.content;
};


/**
 * Public Interfaces
 */
export const getAIInterviewerResponse = async (prompt: string, context: { role: string; phase: 'introduction' | 'questioning' | 'analysis' }, messages: { role: string; text: string }[] = []) => {
    const systemPrompt = `You are a strict technical interviewer for the role: ${context.role}.
Current Phase: ${context.phase}.
In 'introduction', welcome the candidate and ask for a brief intro.
In 'questioning', ask ONE deep technical question at a time.
Ask at least 5-7 questions before concluding.
Focus on core concepts, specific ${context.role} technologies, or coding nuances. 
Do NOT ask for system design. Focus on knowledge verification. Responses MUST be concise.`;

    const groqKey = ENV_CONFIG.VITE_GROQ_API_KEY;
    const sarvamKey = ENV_CONFIG.VITE_SARVAM_API_KEY;

    // Priority: Sarvam > Groq > Gemini (User Request: Full Sarvam Pipeline)
    if (sarvamKey && sarvamKey.length > 20 && !sarvamKey.includes('your_')) {
        try {
            return await sarvamService.chat(prompt, systemPrompt, messages);
        } catch (err: any) {
            console.warn("Sarvam failed, trying Groq fallback:", err);
        }
    }

    if (groqKey && groqKey.length > 20 && !groqKey.includes('your_')) {
        try {
            return await groqService.chat(prompt, systemPrompt);
        } catch (err: any) {
            console.warn("Groq failed, trying Gemini fallback:", err);
        }
    }

    // Fallback to Gemini
    const systemInstruction = `You are a Senior Technical Interviewer for ${context.role}. Phase: ${context.phase}. Responses MUST be concise and plain text.`;
    return await executeGeminiRequest(prompt, systemInstruction);
};

export const getInterviewAnalysis = async (messages: { role: string; text: string }[], role: string) => {
    console.log('📝 Starting analysis for role:', role, 'Message count:', messages.length);
    const sarvamKey = ENV_CONFIG.VITE_SARVAM_API_KEY;
    const groqKey = ENV_CONFIG.VITE_GROQ_API_KEY;
    const geminiKey = ENV_CONFIG.VITE_GEMINI_API_KEY;

    // Priority: Sarvam > Groq > Gemini (User Request: Full Sarvam Pipeline)
    if (sarvamKey && sarvamKey.length > 20 && !sarvamKey.includes('your_')) {
        try {
            console.log('📡 Trying Sarvam evaluation...');
            const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
            const report = await sarvamService.evaluate(transcript);
            if (report && report.score !== undefined) {
                console.log('✅ Sarvam evaluation successful');
                return report;
            }
        } catch (err) {
            console.warn("Sarvam evaluation failed, trying Groq fallback:", err);
        }
    }

    if (groqKey && groqKey.length > 20 && !groqKey.includes('your_')) {
        try {
            return await groqService.evaluate(messages, role);
        } catch (err) {
            console.warn("Groq evaluation failed, trying Gemini fallback:", err);
        }
    }

    // Gemini fallback
    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const systemPrompt = `Analyze transcript for ${role} and return JSON: { "score": number, "summary": string, "strengths": [], "improvements": [], "tips": [] }.`;
    return await executeGeminiRequest(`Transcript:\n${transcript}`, systemPrompt, true);
};

export const getGeminiResponse = async (prompt: string, context: { course?: string; lesson?: string }) => {
    const systemInstruction = `You are ForgeBot, a helpful AI Mentor. Course: ${context.course}, Lesson: ${context.lesson}. Keep responses concise.`;
    return await executeGeminiRequest(prompt, systemInstruction);
};
