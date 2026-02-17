import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;
    const SARVAM_API_KEY = process.env.VITE_SARVAM_API_KEY || process.env.SARVAM_API_KEY;

    if (!SARVAM_API_KEY) {
        return res.status(500).json({ error: 'Sarvam API key not configured' });
    }

    if (!text) {
        return res.status(400).json({ error: 'Missing text parameter' });
    }

    try {
        const response = await axios.post('https://api.sarvam.ai/text-to-speech', {
            inputs: [text],
            target_language_code: 'en-IN',
            speaker: 'kavya',
            model: 'bulbul:v3'
        }, {
            headers: {
                'api-subscription-key': SARVAM_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        if (response.data.audios && response.data.audios.length > 0) {
            res.status(200).json({ audio_content: response.data.audios[0] });
        } else {
            res.status(500).json({ error: 'No audio returned from Sarvam' });
        }
    } catch (error) {
        console.error('Sarvam TTS Error:', error.message);
        const status = error.response?.status || 500;
        const details = error.response?.data || error.message;
        res.status(status).json({ error: 'TTS failed', details });
    }
}
