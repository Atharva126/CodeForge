import { useState, useRef, useEffect } from 'react';

export const useRecorder = (onTextReceived: (text: string) => void, onError?: (msg: string) => void) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef<string>('');

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    transcriptRef.current += finalTranscript + ' ';
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.warn('Speech recognition error', event.error);
            };
        }
    }, []);

    const startRecording = async () => {
        transcriptRef.current = '';
        try {
            // Start Microphone stream for visualization & backup recording
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = []; // Explicit clear

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                console.log(`🎤 Recording stopped. Blob size: ${audioBlob.size} bytes`);
                setIsRecording(false);

                // Stop recognition
                if (recognitionRef.current) recognitionRef.current.stop();

                stream.getTracks().forEach(track => track.stop());

                // DECISION LOGIC:
                // 1. Try Sarvam STT FIRST (Higher Quality) if available
                // Check if we have a key (we need to check ENV_CONFIG here, or import it)
                let sarvamText = null;
                try {
                    const { ENV_CONFIG } = await import('../env_config');
                    if (ENV_CONFIG.VITE_SARVAM_API_KEY && ENV_CONFIG.VITE_SARVAM_API_KEY.length > 10) {
                        console.log('🚀 Prioritizing Sarvam (saarika:v2)...');
                        const { sarvamService } = await import('../services/sarvamService');
                        sarvamText = await sarvamService.stt(audioBlob);
                        if (sarvamText && sarvamText.trim()) {
                            console.log('✅ Sarvam STT Result:', sarvamText);
                            onTextReceived(sarvamText);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Sarvam STT Prio Failed:", e);
                }

                // 2. Fallback: Browser STT (if Sarvam failed or absent)
                if (transcriptRef.current && transcriptRef.current.trim().length > 0) {
                    console.log('✅ Used Browser STT (Fallback):', transcriptRef.current);
                    onTextReceived(transcriptRef.current);
                    return;
                }

                // 3. Final Failure
                console.warn('❌ No speech detected from Sarvam or Browser');
                if (onError) onError("NO_SPEECH_DETECTED");
            };

            mediaRecorder.start();

            // Start Browser STT
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    console.warn('Recognition start failed', e);
                }
            }

            setIsRecording(true);
        } catch (error) {
            console.error('Microphone access denied:', error);
            if (onError) onError("MIC_ACCESS_DENIED");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Small delay to capture end of speech
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
            }, 500);
        }
    };

    return { isRecording, startRecording, stopRecording };
};
