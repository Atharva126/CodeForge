import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    const key = process.env.VITE_SARVAM_API_KEY;
    console.log('Testing Key:', key ? `${key.substring(0, 5)}...` : 'MISSING');

    // Try sarvam-1
    try {
        console.log('\\nTrying sarvam-1...');
        const res = await axios.post('https://api.sarvam.ai/api/v1/chat/completions', {
            model: 'sarvam-1',
            messages: [{ role: 'user', content: 'Say hello' }]
        }, {
            headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' }
        });
        console.log('✅ sarvam-1 Success:', res.data.choices[0].message.content);
    } catch (err) {
        console.log('❌ sarvam-1 Error:', err.response?.status, err.response?.data?.code || err.message);
    }

    // Try sarvam-m
    try {
        console.log('\\nTrying sarvam-m...');
        const res2 = await axios.post('https://api.sarvam.ai/api/v1/chat/completions', {
            model: 'sarvam-m',
            messages: [{ role: 'user', content: 'Say hello' }]
        }, {
            headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' }
        });
        console.log('✅ sarvam-m Success:', res2.data.choices[0].message.content);
    } catch (err) {
        console.log('❌ sarvam-m Error:', err.response?.status, err.response?.data?.code || err.message);
    }
};
test();
