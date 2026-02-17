import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { transcript } = req.body;
    const SARVAM_API_KEY = process.env.VITE_SARVAM_API_KEY || process.env.SARVAM_API_KEY;

    if (!SARVAM_API_KEY) {
        return res.status(500).json({ error: 'Sarvam API key not configured' });
    }

    if (!transcript) {
        return res.status(400).json({ error: 'Missing transcript' });
    }

    try {
        const response = await axios.post('https://api.sarvam.ai/chat/completions', {
            model: 'sarvam-2b',
            messages: [
                {
                    role: 'system',
                    content: 'Review this interview transcript. Return a JSON object with scores.'
                },
                { role: 'user', content: transcript }
            ],
            temperature: 0.3
        }, {
            headers: {
                'api-subscription-key': SARVAM_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 20000
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Sarvam Evaluate Error:', error.message);
        const status = error.response?.status || 500;
        const details = error.response?.data || error.message;
        res.status(status).json({ error: 'Evaluation failed', details });
    }
}
