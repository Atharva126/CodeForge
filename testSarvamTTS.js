import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    const key = process.env.VITE_SARVAM_API_KEY;
    console.log('Sarvam Key:', key ? `${key.substring(0, 8)}...` : 'MISSING');

    const endpoints = [
        'https://api.sarvam.ai/api/v1/text-to-speech',
        'https://api.sarvam.ai/v1/text-to-speech',
        'https://api.sarvam.ai/text-to-speech'
    ];

    console.log('\n--- Testing Bulbul v3 Endpoints ---');
    for (const url of endpoints) {
        try {
            console.log(`Testing: ${url} ...`);
            const res = await axios.post(url, {
                text: 'Hello test',
                speaker: 'meera',
                model: 'bulbul:v3'
            }, {
                headers: {
                    'api-subscription-key': key,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Success for ${url} - audio length: ${res.data.audio_content?.length || 0}`);
        } catch (err) {
            console.log(`❌ Error for ${url}: ${err.response?.status} - ${JSON.stringify(err.response?.data || err.message)}`);
        }
    }

    console.log('\n--- Testing Bulbul v2 Endpoints ---');
    try {
        const res = await axios.post('https://api.sarvam.ai/v1/text-to-speech', {
            text: 'Hello v2',
            speaker: 'meera',
            model: 'bulbul:v2'
        }, {
            headers: {
                'api-subscription-key': key,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Success for v2 - audio length: ${res.data.audio_content?.length || 0}`);
    } catch (err) {
        console.log(`❌ Error for v2: ${err.response?.status} - ${JSON.stringify(err.response?.data || err.message)}`);
    }
};

test();
