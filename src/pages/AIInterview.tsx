import { useState, useEffect, useRef, memo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    MicOff,
    MessageSquare,
    Brain,
    Sparkles,
    LogOut,
    Activity,
    Shield,
    Zap,
    Cpu,
    Loader2,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { getAIInterviewerResponse, getInterviewAnalysis } from '../services/aiService';
import { sarvamService } from '../services/sarvamService';
import { useRecorder } from '../hooks/useRecorder';
import AIVoiceVisualizer from '../components/AIVoiceVisualizer';
import AIAnalysisReport from '../components/AIAnalysisReport';
import { ENV_CONFIG } from '../env_config';

interface Message {
    role: 'ai' | 'user';
    text: string;
    timestamp: Date;
}

const ChatMessage = memo(({ msg }: { msg: Message }) => (
    <motion.div
        initial={{ opacity: 0, x: msg.role === 'ai' ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex gap-4 ${msg.role === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}
    >
        <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border ${msg.role === 'ai'
            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            : 'bg-white/5 border-white/10 text-gray-400'
            }`}>
            {msg.role === 'ai' ? <Cpu className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
        </div>
        <div className={`flex flex-col ${msg.role === 'ai' ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-md px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-xl ${msg.role === 'ai'
                ? 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
                : 'bg-indigo-500 text-white font-medium shadow-indigo-500/10 rounded-tr-none'
                }`}>
                {msg.text}
            </div>
            <span className="text-[9px] uppercase font-black tracking-tighter text-gray-600 mt-2">
                {msg.role === 'ai' ? 'Interviewer' : 'You'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    </motion.div>
));

export default function AIInterview() {
    const { roleId } = useParams();

    // States
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [phase, setPhase] = useState<'introduction' | 'questioning' | 'analysis'>('introduction');
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [diagnostic, setDiagnostic] = useState<string | null>(null);
    const [activeEngine, setActiveEngine] = useState<'Sarvam' | 'Grok' | 'Gemini' | 'None'>('None');
    const [cooldown, setCooldown] = useState(0);

    // Analysis State
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const phaseRef = useRef(phase);
    const isSpeakingRef = useRef(isSpeaking);

    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

    // Cooldown Timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentTranscript]);

    // Initial Engine Detection
    useEffect(() => {
        const groqKey = ENV_CONFIG.VITE_GROQ_API_KEY || (import.meta.env.VITE_GROQ_API_KEY || "").trim();
        const sarvamKey = ENV_CONFIG.VITE_SARVAM_API_KEY || (import.meta.env.VITE_SARVAM_API_KEY || "").trim();
        const grokKey = ENV_CONFIG.VITE_GROK_API_KEY || (import.meta.env.VITE_GROK_API_KEY || "").trim();
        const interviewKey = ENV_CONFIG.VITE_INTERVIEW_API_KEY || (import.meta.env.VITE_INTERVIEW_API_KEY || "").trim();
        const geminiKey = ENV_CONFIG.VITE_GEMINI_API_KEY || (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

        if (groqKey && groqKey.length > 20 && !groqKey.includes('your_')) setActiveEngine('Groq' as any);
        else if (sarvamKey && sarvamKey.length > 20 && !sarvamKey.includes('your_')) setActiveEngine('Sarvam');
        else if (grokKey && grokKey.length > 10) setActiveEngine('Grok');
        else if ((interviewKey && interviewKey.length > 10) || (geminiKey && geminiKey.length > 10)) setActiveEngine('Gemini');
        else setActiveEngine('None');
    }, []);

    // Removed auto-start - user must click Start button for TTS to work

    const handleUserAnswer = async (answer: string) => {
        // Safety check for undefined/null responses from STT
        if (!answer || typeof answer !== 'string' || !answer.trim() || isSpeakingRef.current || isThinking) {
            console.warn('Invalid answer or busy:', { answer, isSpeaking: isSpeakingRef.current, isThinking });
            return;
        }

        const newUserMessage: Message = { role: 'user', text: answer, timestamp: new Date() };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);

        setCurrentTranscript('');
        setIsThinking(true);
        setError(null);
        setDiagnostic(null);

        try {
            console.log('📡 Fetching AI Response for answer:', answer);
            const aiResponse = await getAIInterviewerResponse(answer, {
                role: roleId || 'Software Engineer',
                phase: phaseRef.current
            }, updatedMessages);
            console.log('✅ AI Responded:', aiResponse.substring(0, 50));

            setIsThinking(false);

            // Logic to progress through phases
            if (phaseRef.current === 'introduction') {
                console.log('📈 Transitioning to QUESTIONING phase');
                setPhase('questioning');
            } else if (aiResponse.toLowerCase().includes('thank you for your time') || aiResponse.toLowerCase().includes('let\'s conclude')) {
                console.log('🏁 AI requested to conclude');
                setPhase('analysis');
            }

            const newAiMessage: Message = { role: 'ai', text: aiResponse, timestamp: new Date() };
            setMessages(prev => [...prev, newAiMessage]);
            speak(aiResponse);
        } catch (err: any) {
            console.error("Answer handling failed:", err);
            setDiagnostic(err.message || "SIGNAL_LOST");
            setError(err.message === 'QUOTA_EXCEEDED' ? 'SARVAM_CREDITS_EXHAUSTED' : "VOICE_LINK_BROKEN");
            setIsThinking(false);
        }
    };

    const handleRecorderError = (msg: string) => {
        console.warn("Recorder Error:", msg);
        if (msg === "NO_SPEECH_DETECTED") {
            setDiagnostic("MICROPHONE_SILENCE");
            // Optional: Speak "I didn't hear anything"
        } else if (msg === "STT_FAILED") {
            setError("STT_SERVICE_FAILED");
            setDiagnostic("SARVAM_STT_ERROR");
        }
        setIsThinking(false);
    };

    const { isRecording, startRecording, stopRecording } = useRecorder(handleUserAnswer, handleRecorderError);

    // Initial Server Check
    useEffect(() => {
        const checkServer = async () => {
            if (activeEngine === 'Sarvam') {
                // If on Vercel/Production, the proxy is at /api/sarvam
                if (window.location.hostname !== 'localhost') {
                    console.log('✅ Sarvam Engine Active (Vercel API Routes)');
                    return;
                }

                try {
                    const port = ENV_CONFIG.VITE_SARVAM_PORT || 5000;
                    const res = await fetch(`http://localhost:${port}/`);
                    if (res.ok) console.log('✅ Sarvam Proxy Online');
                    else throw new Error("Server error");
                } catch (e) {
                    console.error("❌ Sarvam Proxy Offline");
                    setError("PROXY_DISCONNECTED");
                    setDiagnostic("NODE_SERVER_DOWN");
                }
            }
        };
        checkServer();
    }, [activeEngine]);

    const startInterview = async () => {
        console.log('🎯 Starting interview...');
        setIsThinking(true);
        setError(null);
        setDiagnostic(null);
        try {
            console.log('📞 Calling getAIInterviewerResponse...');
            const intro = await getAIInterviewerResponse("Introduce yourself and start the interview.", {
                role: roleId || 'Software Engineer',
                phase: 'introduction'
            }, []);
            console.log('✅ Got response:', intro.substring(0, 50) + '...');
            setIsThinking(false);
            setMessages([{ role: 'ai', text: intro, timestamp: new Date() }]);
            speak(intro);
        } catch (err: any) {
            console.error("❌ Interview Start failed:", err);
            const msg = err.message || "OFFLINE";
            setDiagnostic(msg);

            if (msg.includes("QUOTA")) {
                setError("QUOTA_LIMIT_REACHED");
                setCooldown(60);
            } else {
                setError("AGENT_CONNECTION_FAILED");
            }
            setIsThinking(false);
        }
    };

    const speak = async (text: string) => {
        if (!text) return;
        setIsSpeaking(true);

        // Track if Sarvam successfully starts playing
        let sarvamStarted = false;

        // Cancel any ongoing browser speech immediately
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // Try Sarvam TTS first
        try {
            console.log("🎙️ [Sarvam Attempt] Text:", text.substring(0, 50) + "...");
            const audioBase64 = await sarvamService.tts(text);
            console.log("📡 [Sarvam Received] Audio length:", audioBase64.length);

            // Cleanup previous audio if any
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }

            const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
            audioRef.current = audio;

            audio.onplay = () => {
                sarvamStarted = true;
                console.log("🔊 [Sarvam Playback] Started successfully");
                // Secondary check: Ensure browser keeps quiet once Sarvam starts
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
            };

            audio.onended = () => {
                console.log("✅ [Sarvam Finished]");
                setIsSpeaking(false);
                if (phaseRef.current === 'analysis') {
                    generateAnalysis();
                }
            };

            audio.onerror = (e) => {
                console.error("❌ [Sarvam Audio Error]:", e);
                // Only fallback if we haven't already started playing successfully
                if (!sarvamStarted) {
                    console.log("🔄 [Fallback] Triggering browser TTS due to audio element error");
                    browserSpeakFallback(text);
                } else {
                    console.warn("⚠️ [Sarvam Interrupted] Error occurred mid-playback, not falling back to avoid double-speech");
                    setIsSpeaking(false);
                }
            };

            await audio.play();
            return; // Success
        } catch (err: any) {
            console.error("⚠️ [Sarvam Request Failed]:", err.message);
            // Full fallback to browser if API call or initialization fails
            browserSpeakFallback(text);
        }
    };

    const browserSpeakFallback = (text: string) => {
        if (!('speechSynthesis' in window)) {
            console.error("❌ [Fallback Error] No TTS available at all");
            setIsSpeaking(false);
            return;
        }

        console.log("🗣️ [Browser TTS] Starting fallback...");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        utterance.onstart = () => console.log('🔊 [Browser TTS] Playback started');
        utterance.onend = () => {
            console.log('✅ [Browser TTS] Finished');
            setIsSpeaking(false);
            if (phaseRef.current === 'analysis') {
                generateAnalysis();
            }
        };

        utterance.onerror = (e) => {
            console.error("❌ [Browser TTS Error]:", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    const generateAnalysis = async () => {
        console.log('🎯 Entering generateAnalysis Phase. Message count:', messages.length);
        if (messages.length < 2) {
            console.warn('⚠️ Not enough messages for analysis:', messages.length);
            setError("NEED_MORE_CONVERSATION_FOR_REPORT");
            return;
        }
        setIsGeneratingAnalysis(true);
        setError(null);
        try {
            console.log('📊 Contacting Sarvam for Analysis Report...');
            const report = await getInterviewAnalysis(messages, roleId || 'Software Engineer');
            console.log('✅ Analysis Report received:', report);
            setAnalysisData(report);
        } catch (err: any) {
            console.error('Failed to generate analysis:', err);
            setDiagnostic(err.message || "ANALYSIS_FAILURE");
            setError("REPORT_GEN_FAILED");
        } finally {
            setIsGeneratingAnalysis(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
            {/* Analysis Overlay */}
            <AnimatePresence>
                {analysisData && analysisData.score !== undefined && (
                    <AIAnalysisReport data={analysisData} role={roleId?.replace('-', ' ') || 'Software Engineer'} />
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="px-8 py-6 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">AI Interviewer</h1>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                                <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                                    {error ? 'Link Interrupted' : `Active • ${activeEngine} Neural Engine`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isRecording ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        isThinking || isGeneratingAnalysis ? 'bg-indigo-500/20 text-indigo-400 border-indigo-400/30 animate-pulse' :
                            error ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-white/5 text-gray-500 border-white/10'
                        }`}>
                        {isRecording ? 'Agent is Listening...' :
                            isThinking ? 'Syncing Neural Link...' :
                                isSpeaking ? 'Agent is Speaking...' :
                                    isGeneratingAnalysis ? 'Finalizing Report...' :
                                        error ? 'Signal Offline' :
                                            "Standby..."}
                    </div>
                    <button
                        onClick={() => {
                            if (phase === 'analysis') return;
                            setPhase('analysis');
                            generateAnalysis();
                        }}
                        disabled={isGeneratingAnalysis}
                        className="px-6 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        {isGeneratingAnalysis ? 'Analyzing...' : 'End Interview'}
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-3 z-50 backdrop-blur-xl shadow-2xl shadow-red-500/20 max-w-lg"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{error}</span>
                            <button
                                onClick={startInterview}
                                className="ml-4 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition-all flex items-center gap-2 border border-red-500/20"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reconnect</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

                {/* Left Side: Transcript */}
                <div className="w-1/3 border-r border-white/5 bg-black/20 backdrop-blur-sm flex flex-col z-10">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Interview Log</span>
                        </div>
                        <Activity className="w-4 h-4 text-indigo-500/50" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <button
                                    onClick={startInterview}
                                    disabled={isThinking}
                                    className="px-8 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/50 transition-all hover:scale-105 disabled:scale-100 flex items-center gap-3"
                                >
                                    {isThinking ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" />
                                            Start Interview
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <>
                                <AnimatePresence>
                                    {messages.map((msg, i) => (
                                        <ChatMessage key={i} msg={msg} />
                                    ))}
                                </AnimatePresence>

                                {currentTranscript && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-row-reverse gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 animate-pulse">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="max-w-md px-5 py-3 rounded-2xl text-sm leading-relaxed bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 italic rounded-tr-none">
                                                {currentTranscript}...
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/5 bg-black/40">
                        <div className="mb-4">
                            <AIVoiceVisualizer isListening={isRecording} />
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                className={`p-4 rounded-2xl border transition-all ${isRecording ? 'bg-red-500 scale-95 shadow-lg shadow-red-500/50 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                            >
                                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <div className="flex-1 h-14 bg-white/4 rounded-2xl border border-white/5 flex items-center px-6 text-xs text-gray-500 font-bold uppercase tracking-widest overflow-hidden">
                                {isRecording ? "Listening..." : isSpeaking ? "Agent Speaking..." : isThinking ? "Processing..." : isGeneratingAnalysis ? "Analyzing..." : error ? "Link Down" : "Hold Mic to Speak"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: AI Avatar & Animation */}
                <div className="flex-1 relative flex flex-col items-center justify-center p-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={phase}
                            initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="relative w-96 h-96"
                        >
                            {/* Outer Liquid Glow */}
                            <motion.div
                                animate={{
                                    scale: isSpeaking || isThinking || isGeneratingAnalysis ? [1, 1.25, 1] : [1, 1.05, 1],
                                    opacity: isSpeaking || isGeneratingAnalysis || isThinking ? [0.1, 0.4, 0.1] : error ? 0.02 : [0.05, 0.2, 0.05],
                                    borderRadius: ["40%", "50%", "45%", "40%"]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className={`absolute inset-[-60px] ${error ? 'bg-red-500' : 'bg-indigo-500'} shadow-[0_0_100px_rgba(99,102,241,0.2)] blur-[80px]`}
                            />

                            {/* Rotating Morphing Rings */}
                            <motion.div
                                animate={{
                                    rotate: 360,
                                    borderRadius: ["50% 50% 50% 50%", "40% 60% 40% 60%", "50% 50% 50% 50%"]
                                }}
                                transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, borderRadius: { duration: 5, repeat: Infinity } }}
                                className={`absolute inset-0 border-2 ${error ? 'border-red-500/20 border-t-red-500/50' : 'border-indigo-500/20 border-t-indigo-500/50'} shadow-lg`}
                            />

                            {/* Main Core Container */}
                            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#0a0a0f] via-black to-[#0f0a15] border border-white/5 overflow-hidden flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />

                                {/* Inner Pulsing Intelligence */}
                                <motion.div
                                    animate={{
                                        scale: isSpeaking || isGeneratingAnalysis || isThinking ? [1, 1.1, 1] : 1,
                                        boxShadow: isSpeaking || isGeneratingAnalysis || isThinking
                                            ? ["0 0 50px rgba(99, 102, 241, 0.2)", "0 0 100px rgba(168, 85, 247, 0.4)", "0 0 50px rgba(99, 102, 241, 0.2)"]
                                            : error ? "0 0 20px rgba(239, 68, 68, 0.1)" : "0 0 40px rgba(99, 102, 241, 0.1)"
                                    }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                    className={`w-48 h-48 rounded-full ${error ? 'bg-red-500/5 border-red-500/20' : 'bg-indigo-500/5 border-indigo-500/20'} flex items-center justify-center relative backdrop-blur-3xl`}
                                >
                                    {isGeneratingAnalysis || isThinking ? (
                                        <Loader2 className="w-14 h-14 text-indigo-400 animate-spin" />
                                    ) : error ? (
                                        <AlertCircle className="w-14 h-14 text-red-500/50" />
                                    ) : (
                                        <Sparkles className={`w-14 h-14 text-indigo-400/80 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] ${isSpeaking ? 'animate-pulse' : ''}`} />
                                    )}

                                    {/* Liquid Frequency Waves */}
                                    <AnimatePresence>
                                        {(isSpeaking || isGeneratingAnalysis || isThinking) && (
                                            <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-8">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 4 }}
                                                        animate={{ height: [8, 32, 12, 40, 8] }}
                                                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08 }}
                                                        className="w-1 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full shadow-[0_0_100px_rgba(99,102,241,0.3)]"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-20 text-center relative">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'} text-[10px] font-black uppercase tracking-[0.2em] mb-4`}
                        >
                            <Activity className={`w-3 h-3 ${error ? 'animate-pulse' : ''}`} />
                            Signal Strength: {error ? 'Offline' : 'Optimal'}
                        </motion.div>
                        <h2 className="text-3xl font-black tracking-widest uppercase text-white drop-shadow-2xl">
                            {isGeneratingAnalysis ? 'Neural Analysis' : isThinking ? 'Syncing Neural Link' : error ? 'Agent Blocked' : 'Forge Technical Agent'}
                        </h2>

                        {diagnostic && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-6 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest max-w-sm mx-auto backdrop-blur-xl"
                            >
                                Diagnosis: {diagnostic}
                                <div className="mt-2 pt-2 border-t border-red-500/10 text-[8px] opacity-70 flex flex-col gap-1">
                                    <span>Mechanism: {activeEngine} Hybrid Control</span>
                                    <span>Sarvam Key: {ENV_CONFIG.VITE_SARVAM_API_KEY ? "CONFIGURED (VITE_ prefix)" : "MISSING"}</span>
                                    <span>Port: 5000 (Local Proxy)</span>
                                </div>
                            </motion.div>
                        )}

                        <div className="flex items-center justify-center gap-6 mt-6">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Engine</span>
                                <span className="text-xs font-bold text-gray-300">{activeEngine} Hybrid Agent</span>
                            </div>
                            <div className="w-px h-8 bg-white/5" />
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</span>
                                <span className={`text-xs font-bold ${isThinking || isGeneratingAnalysis ? 'text-indigo-400 animate-pulse' : error ? 'text-red-500' : 'text-green-500'}`}>
                                    {isThinking || isGeneratingAnalysis ? 'Syncing' : error ? 'Offline' : 'Online'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
