import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Mic, MicOff, MessageSquare, Brain,
    Sparkles, Zap, Loader2, AlertCircle
} from 'lucide-react';
import { sarvamService } from '../services/sarvamService';
import { sessionHandler } from '../services/SessionHandler';
import { useRecorder } from '../hooks/useRecorder';

export default function SarvamInterview() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<any[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleTextReceived = async (text: string) => {
        if (!text.trim()) return;

        sessionHandler.addEntry('user', text);
        setMessages(prev => [...prev, { role: 'user', text, timestamp: new Date() }]);

        setIsThinking(true);
        try {
            const aiResponse = await sarvamService.chat(text);
            setIsThinking(false);

            sessionHandler.addEntry('ai', aiResponse);
            setMessages(prev => [...prev, { role: 'ai', text: aiResponse, timestamp: new Date() }]);

            const audioBase64 = await sarvamService.tts(aiResponse);
            playAudio(audioBase64);
        } catch (err: any) {
            setError(err.message === 'QUOTA_EXCEEDED' ? 'SARVAM_CREDITS_EXHAUSTED' : 'CONNECTION_FAILED');
            setIsThinking(false);
        }
    };

    const { isRecording, startRecording, stopRecording } = useRecorder(handleTextReceived);

    const playAudio = (base64: string) => {
        const audio = new Audio(`data:audio/wav;base64,${base64}`);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
    };

    useEffect(() => {
        const greet = async () => {
            setIsThinking(true);
            try {
                const aiGreeting = await sarvamService.chat("Hello, I am ready for the interview.");
                sessionHandler.addEntry('ai', aiGreeting);
                setMessages([{ role: 'ai', text: aiGreeting, timestamp: new Date() }]);
                setIsThinking(false);
                const audioBase64 = await sarvamService.tts(aiGreeting);
                playAudio(audioBase64);
            } catch (err) {
                console.error('Initial greeting failed', err);
                setIsThinking(false);
            }
        };
        greet();
        return () => {
            sessionHandler.clear();
        };
    }, []);

    const endInterview = async () => {
        navigate('/interview/sarvam-results');
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
            <header className="px-8 py-6 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight uppercase">Sarvam AI Interview</h1>
                        <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Powered by Sarvam-M & Saarika</span>
                    </div>
                </div>
                <button
                    onClick={endInterview}
                    className="px-6 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest border border-red-500/20"
                >
                    End Interview
                </button>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <div className="w-1/3 border-r border-white/5 bg-black/20 flex flex-col p-6 overflow-y-auto space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase text-gray-400">Live Transcript</span>
                    </div>
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'ai' ? 'bg-white/5 text-gray-300' : 'bg-indigo-600 text-white'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                <span className="text-xs text-gray-500 uppercase font-bold">Interviewer is thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {error && (
                        <div className="absolute top-8 px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold uppercase flex items-center gap-3 z-50">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="relative w-64 h-64 mb-12">
                        <motion.div
                            animate={{ scale: isRecording ? [1, 1.2, 1] : 1 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${isRecording ? 'bg-red-500' : 'bg-indigo-500'}`}
                        />
                        <div className="absolute inset-0 rounded-full border-2 border-white/10 flex items-center justify-center">
                            <Sparkles className={`w-24 h-24 ${isSpeaking ? 'text-indigo-400 animate-pulse' : 'text-white/20'}`} />
                        </div>
                        {isSpeaking && (
                            <div className="absolute inset-0 flex items-center justify-center gap-1">
                                {[1, 2, 3, 4].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [4, 16, 4] }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                        className="w-1 bg-indigo-400 rounded-full"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-8">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase text-gray-400">Neural Link Active</span>
                        </div>
                        <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 scale-90 shadow-2xl shadow-red-500/50' : 'bg-indigo-500 hover:scale-105 shadow-xl shadow-indigo-500/30'}`}
                        >
                            {isRecording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                        </button>
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">
                            {isRecording ? "Release to Send" : "Hold to Speak"}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
