import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, systemPrompt, messages: history } = req.body;
    const SARVAM_API_KEY = process.env.VITE_SARVAM_API_KEY || process.env.SARVAM_API_KEY;

    if (!SARVAM_API_KEY) {
        return res.status(500).json({ error: 'Sarvam API key not configured' });
    }

    try {
        let messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

        if (history && Array.isArray(history)) {
            const recentHistory = history.slice(-5).map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : 'user',
                content: msg.text || msg.content
            }));
            messages = [...messages, ...recentHistory];
        } else if (prompt) {
            messages.push({ role: 'user', content: prompt });
        }

        const response = await axios.post('https://api.sarvam.ai/chat/completions', {
            model: 'sarvam-2b',
            messages: messages,
            temperature: 0.7
        }, {
            headers: {
                'api-subscription-key': SARVAM_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Sarvam Chat Error:', error.message);
        const status = error.response?.status || 500;
        const details = error.response?.data || error.message;
        res.status(status).json({ error: 'Chat failed', details });
    }
}
