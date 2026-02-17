export interface SarvamChatResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

export interface SarvamTTSResponse {
    audio_content: string; // Base64
}

export interface SarvamSTTResponse {
    transcript: string;
}

const BACKEND_URL = '/api/sarvam';

export const sarvamService = {
    async chat(prompt: string, systemPrompt?: string, messages?: any[]): Promise<string> {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, systemPrompt, messages })
        });

        if (response.status === 402) throw new Error('QUOTA_EXCEEDED');
        const data: any = await response.json();

        if (!response.ok) {
            console.error('❌ Sarvam Backend Error:', data);
            throw new Error(data.details?.message || data.error || 'Backend Error');
        }

        console.log('🎙️ Sarvam Chat Debug:', data);

        if (!data.choices || !data.choices[0]) {
            console.warn('🎙️ Malformed Sarvam Response:', data);
            throw new Error('Malformed AI response (missing choices)');
        }

        return data.choices[0].message.content;
    },

    async tts(text: string): Promise<string> {
        try {
            const response = await fetch(`${BACKEND_URL}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details?.message || errorData.error || 'TTS Proxy Error');
            }

            const data: SarvamTTSResponse = await response.json();
            if (!data.audio_content) {
                throw new Error('Empty audio content received from Sarvam');
            }
            return data.audio_content;
        } catch (error: any) {
            console.error('🎙️ Sarvam TTS Error:', error.message);
            throw error;
        }
    },

    async stt(audioBlob: Blob): Promise<string> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        const response = await fetch(`${BACKEND_URL}/stt`, {
            method: 'POST',
            body: formData
        });

        const data: SarvamSTTResponse = await response.json();
        return data.transcript;
    },

    async evaluate(transcript: string): Promise<any> {
        const response = await fetch(`${BACKEND_URL}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript })
        });

        return response.json();
    }
};
