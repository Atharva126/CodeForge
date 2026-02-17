import { ENV_CONFIG } from "../env_config";

const GROK_API_KEY = ENV_CONFIG.VITE_GROK_API_KEY || import.meta.env.VITE_GROK_API_KEY;
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

/**
 * Common handler for xAI API calls
 */
async function callGrokAPI(messages: any[], responseFormat?: { type: "json_object" }) {
    if (!GROK_API_KEY || GROK_API_KEY === 'your_free_key_here' || GROK_API_KEY.includes(' ')) {
        console.error("Grok API Key Error: Invalid or missing key.");
        throw new Error("Grok API link offline. Please ensure VITE_GROK_API_KEY is correctly set in your .env file.");
    }

    try {
        const response = await fetch(XAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROK_API_KEY}`
            },
            body: JSON.stringify({
                model: "grok-beta",
                messages: messages,
                temperature: 0.7,
                response_format: responseFormat
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("xAI API Error:", errorData);
            throw new Error(errorData?.error?.message || `Grok API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error: any) {
        console.error("Grok Network/API Error:", error);
        throw new Error(error.message || "Failed to reach Grok (xAI). Check your network or API key.");
    }
}

export const getGrokInterviewerResponse = async (
    prompt: string,
    messages: { role: 'ai' | 'user'; text: string }[],
    context: { role: string; phase: 'introduction' | 'questioning' | 'analysis' }
) => {
    const systemPrompt = `You are a Senior Technical Interviewer at a top-tier tech company. 
    You are conducting a professional technical interview for the role of ${context.role}.
    
    Phase: ${context.phase}
    
    Guidelines:
    1. Introduction Phase: Briefly welcome the student and ask them to introduce themselves.
    2. Questioning Phase: Ask one technical question at a time. Provide brief positive reinforcement if appropriate, and ask follow-ups.
    3. Analysis Phase: Conclude the interview professionally. 
    4. Keep responses CONCISE (under 50 words) for Text-to-Speech.
    5. Do NOT include Markdown formatting (like bolding or headers).
    6. Maintain a professional, encouraging, and high-tech persona.`;

    const chatMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.text
        })),
        { role: "user", content: prompt }
    ];

    return await callGrokAPI(chatMessages);
};

export const getGrokInterviewAnalysis = async (
    messages: { role: 'ai' | 'user'; text: string }[],
    role: string
) => {
    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

    const prompt = `As a Senior Technical Interviewer, analyze the following interview transcript for a ${role} position.
    
    Transcript:
    ${transcript}

    Return a JSON object with the following structure:
    {
        "score": number (0-100),
        "summary": "string (brief overall impression)",
        "strengths": ["string", "string", ...],
        "improvements": ["string", "string", ...],
        "tips": ["string", "string", ...]
    }
    
    Be constructive, professional, and specific to their technical answers.`;

    const chatMessages = [
        {
            role: "system",
            content: "You are a technical talent analyst. You must return only valid JSON."
        },
        { role: "user", content: prompt }
    ];

    const response = await callGrokAPI(chatMessages, { type: "json_object" });
    try {
        return JSON.parse(response);
    } catch (e) {
        console.error("JSON Parse Error from Grok:", response);
        throw new Error("Analysis format error. Grok returned invalid JSON.");
    }
};
