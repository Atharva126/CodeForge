import { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const SupportChatbot = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm ForgeBot. How can I help you navigate CodeForge today?",
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const navigationTriggers = [
        { keywords: ['problem', 'solve', 'coding'], route: '/problems', label: 'Problems' },
        { keywords: ['contest', 'battle', 'competition'], route: '/contests', label: 'Contests' },
        { keywords: ['store', 'buy', 'coins', 'shop'], route: '/store', label: 'Store' },
        { keywords: ['quest', 'challenge', 'progress'], route: '/challenges', label: 'Quests' },
        { keywords: ['leaderboard', 'rank', 'top'], route: '/leaderboard', label: 'Leaderboard' },
        { keywords: ['profile', 'account', 'settings'], route: '/profile', label: 'Profile' },
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');

        // Simulate bot thinking
        setTimeout(() => {
            const lowerInput = inputValue.toLowerCase();
            let response = "I'm not sure about that, but I can help you find problems, contests, or the store! Try asking 'Where are the contests?'";

            for (const trigger of navigationTriggers) {
                if (trigger.keywords.some(k => lowerInput.includes(k))) {
                    response = `You can find that in the ${trigger.label} section. Would you like to go there?`;
                    // You could add an actual link button here in a real implementation
                    break;
                }
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
        }, 800);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-80 h-[450px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl flex flex-col z-[100] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="p-4 bg-indigo-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight italic">ForgeBot</h3>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-indigo-100 font-medium uppercase tracking-widest">Always Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/50 custom-scrollbar">
                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[85%] ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${m.sender === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${m.sender === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-none border border-gray-100 dark:border-gray-700'
                                }`}>
                                {m.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Suggestions */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <button onClick={() => { setInputValue('How to solve problems?'); }} className="whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 rounded-full hover:bg-indigo-50 hover:text-indigo-500 transition-colors uppercase tracking-widest">Solving</button>
                <button onClick={() => { setInputValue('Where is the store?'); }} className="whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 rounded-full hover:bg-indigo-50 hover:text-indigo-500 transition-colors uppercase tracking-widest">Store</button>
                <button onClick={() => { setInputValue('Rankings?'); }} className="whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 rounded-full hover:bg-indigo-50 hover:text-indigo-500 transition-colors uppercase tracking-widest">Learderboard</button>
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                    <button
                        onClick={handleSend}
                        className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupportChatbot;
