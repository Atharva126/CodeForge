import { ENV_CONFIG } from '../env_config';

const GROQ_API_KEY = ENV_CONFIG.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const groqService = {
    async chat(prompt: string, systemPrompt?: string): Promise<string> {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Fast and capable model
                messages: [
                    { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Groq API Error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    },

    async evaluate(messages: any[], role: string): Promise<any> {
        const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
        const systemPrompt = `Analyze this ${role} interview transcript and return a JSON report with: score (0-100), strengths (array), improvements (array), tips (array). Return ONLY valid JSON.`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: transcript }
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) throw new Error('Groq evaluation failed');
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    }
};
