import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    const key = process.env.VITE_GROQ_API_KEY;
    console.log('Groq Key:', key ? `${key.substring(0, 10)}...` : 'MISSING');
    console.log('Key Length:', key?.length);
    console.log('Has placeholder?:', key?.includes('your_'));

    if (!key || key.length < 20 || key.includes('your_')) {
        console.log('❌ Key validation failed - will fall back to Gemini');
        return;
    }

    try {
        console.log('\nTesting Groq API...');
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say hello' }],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Groq Success:', res.data.choices[0].message.content);
    } catch (err) {
        console.log('❌ Groq Error:', err.response?.status, err.response?.data || err.message);
    }
};
test();
