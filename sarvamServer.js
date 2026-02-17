import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Robust Body Parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logger
app.use((req, res, next) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] 🛠️ ${req.method} ${req.url}`);
    if (req.method !== 'OPTIONS') {
        console.log(`[Headers]: ${JSON.stringify(req.headers)}`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log(`[Body Keys]: ${Object.keys(req.body).join(', ')}`);
        } else {
            console.log(`[Body]: EMPTY`);
        }
    }
    next();
});

const SARVAM_API_KEY = (process.env.VITE_SARVAM_API_KEY || process.env.SARVAM_API_KEY || "").trim();

console.log('--- Sarvam Proxy Initialization ---');
console.log('Key Loaded:', SARVAM_API_KEY ? `${SARVAM_API_KEY.substring(0, 5)}...${SARVAM_API_KEY.substring(SARVAM_API_KEY.length - 4)}` : "MISSING");
console.log('Port Config:', process.env.VITE_SARVAM_PORT || process.env.SARVAM_PORT || 5000);
console.log('-----------------------------------');

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'ok', server: 'Sarvam Proxy', version: '1.2.5' });
});

// 1. Chat/LLM Endpoint
app.post('/api/sarvam/chat', async (req, res) => {
    const requestId = Date.now();
    try {
        const { prompt, systemPrompt, messages: history } = req.body;
        if (!prompt && (!history || history.length === 0)) {
            return res.status(400).json({ error: 'Missing prompt or messages' });
        }

        console.log(`[${requestId}] 📡 [Chat Request]`);

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

        console.log(`[${requestId}] ✅ [Chat Success]`);
        res.json(response.data);
    } catch (error) {
        console.error(`[${requestId}] ❌ [Chat Error]:`, error.message);
        const status = error.response?.status || 500;
        const details = error.response?.data || error.message;
        res.status(status).json({ error: 'Chat failed', details });
    }
});

// 2. TTS Endpoint (bulbul:v3)
app.post('/api/sarvam/tts', async (req, res) => {
    const requestId = Date.now();
    try {
        const { text } = req.body;
        if (!text) {
            console.error(`[${requestId}] ❌ [TTS Error] Missing text`);
            return res.status(400).json({ error: 'Missing text parameter' });
        }

        console.log(`[${requestId}] 📡 [TTS Request] Text: ${text.substring(0, 30)}...`);

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

        console.log(`[${requestId}] ✅ [TTS Success]`);

        if (response.data.audios && response.data.audios.length > 0) {
            res.json({ audio_content: response.data.audios[0] });
        } else {
            console.warn(`[${requestId}] ⚠️ [TTS No Audio]`);
            res.status(500).json({ error: 'No audio returned from Sarvam' });
        }
    } catch (error) {
        console.error(`[${requestId}] ❌ [TTS Exception]:`, error.stack || error.message);
        const status = error.response?.status || 500;
        const details = error.response?.data || error.message;
        res.status(status).json({ error: 'TTS failed', details });
    }
});

// 3. STT Endpoint (saarika:v2)
app.post('/api/sarvam/stt', upload.single('audio'), async (req, res) => {
    const requestId = Date.now();
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });

        console.log(`[${requestId}] 🎤 STT Receive: ${req.file.originalname}`);

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), {
            filename: 'audio.wav',
            contentType: 'audio/wav',
        });
        formData.append('model', 'saarika:v2');

        const response = await axios.post('https://api.sarvam.ai/speech-to-text', formData, {
            headers: {
                ...formData.getHeaders(),
                'api-subscription-key': SARVAM_API_KEY
            },
            timeout: 15000
        });

        console.log(`[${requestId}] ✅ STT Success`);

        try { fs.unlinkSync(req.file.path); } catch (e) { }
        res.json(response.data);
    } catch (error) {
        if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) { }
        console.error(`[${requestId}] ❌ STT Error:`, error.message);
        const status = error.response?.status || 500;
        res.status(status).json({ error: 'STT failed', details: error.message });
    }
});

// 4. Evaluation Endpoint
app.post('/api/sarvam/evaluate', async (req, res) => {
    const requestId = Date.now();
    try {
        const { transcript } = req.body;
        if (!transcript) return res.status(400).json({ error: 'Missing transcript' });

        console.log(`[${requestId}] 📡 [Eval Request]`);

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

        res.json(response.data);
    } catch (error) {
        console.error(`[${requestId}] ❌ [Eval Error]:`, error.message);
        res.status(500).json({ error: 'Eval failed' });
    }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sarvam Proxy v1.2.5 listening on port ${PORT}`);
});
