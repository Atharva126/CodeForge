import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Sparkles, MessageSquare, Lightbulb, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGeminiResponse } from '../services/aiService';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

interface CourseAIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    courseName?: string;
    lessonTitle?: string;
}

export default function CourseAIAssistant({ isOpen, onClose, courseName, lessonTitle }: CourseAIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial welcome message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: '1',
                    text: `Hi! I'm your AI Course Mentor. I'm here to help you master "${courseName}". Any questions about "${lessonTitle}"?`,
                    sender: 'bot',
                    timestamp: new Date(),
                },
            ]);
        }
    }, [courseName, lessonTitle]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (text: string = inputValue) => {
        if (!text.trim()) return;
        setError(null);

        const userMsg: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const aiTitle = await getGeminiResponse(text, { course: courseName, lesson: lessonTitle });

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: aiTitle,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (err: any) {
            console.error("Assistant Error:", err);
            setError(err.message || "Something went wrong.");
        } finally {
            setIsTyping(false);
        }
    };

    const suggestions = [
        "Explain this concept simply",
        "Give me a code example",
        "How is this used in real projects?",
        "Summary of this lesson"
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-[70] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 bg-indigo-600 dark:bg-indigo-900/50 border-b border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white tracking-tight leading-tight">AI MENTOR</h3>
                                        <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                            Context Aware
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-950/50 scroll-smooth custom-scrollbar">
                            {messages.map((m) => (
                                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[90%] ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-indigo-500 border border-indigo-100 dark:border-gray-700'}`}>
                                            {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${m.sender === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-none border border-gray-200 dark:border-gray-700'
                                            }`}>
                                            {m.text.split('\n').map((line, i) => (
                                                <React.Fragment key={i}>
                                                    {line}
                                                    {i !== m.text.split('\n').length - 1 && <br />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 max-w-[90%]">
                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 flex items-center justify-center">
                                            <Bot className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-500 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-tight">AI Error</p>
                                        <p className="text-[10px] font-medium leading-relaxed">{error}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Input Area */}
                        <div className="p-6 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 space-y-4">
                            {/* Suggestions */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {suggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(suggestion)}
                                        className="whitespace-nowrap px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-all border border-indigo-100 dark:border-indigo-500/20 uppercase tracking-widest"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>

                            <div className="relative group">
                                <textarea
                                    rows={2}
                                    placeholder="Ask anything about this lesson..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-2xl py-4 pl-5 pr-14 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-400 dark:placeholder-gray-600 resize-none"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="absolute right-3 bottom-4 p-2.5 bg-indigo-600 text-white rounded-xl hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 group-hover:rotate-6"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                <div className="flex items-center gap-1.5">
                                    <Lightbulb className="w-3 h-3 text-yellow-500" />
                                    <span>Hints</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <BookOpen className="w-3 h-3 text-indigo-500" />
                                    <span>Resources</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MessageSquare className="w-3 h-3 text-green-500" />
                                    <span>Q&A</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
