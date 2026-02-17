const axios = require('axios');
const fs = require('fs');
const key = 'sk_11d9vqt4_fwTXsD2ULL0DSN0Pc5j1qg8o';

const endpoints = [
    'https://api.sarvam.ai/text-to-speech',
    'https://api.sarvam.ai/api/v1/text-to-speech',
    'https://api.sarvam.ai/v1/text-to-speech'
];

async function runTests() {
    let logs = '';
    for (const url of endpoints) {
        logs += `\nTesting URL: ${url}\n`;
        // Try multiple payload styles
        const payloads = [
            { text: 'test', speaker: 'meera', model: 'bulbul:v3' },
            { inputs: ['test'], target_language_code: 'en-IN', speaker: 'meera', model: 'bulbul:v3' }
        ];

        for (const body of payloads) {
            logs += `Payload: ${JSON.stringify(body)}\n`;
            try {
                const res = await axios.post(url, body, {
                    headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' },
                    timeout: 5000
                });
                logs += `SUCCESS: audio length ${res.data.audio_content?.length}\n`;
            } catch (err) {
                logs += `FAIL ${err.response?.status}: ${JSON.stringify(err.response?.data)}\n`;
            }
        }
    }
    fs.writeFileSync('debug_tts_final.txt', logs);
}

runTests();
