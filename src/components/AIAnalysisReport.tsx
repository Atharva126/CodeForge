import { motion } from 'framer-motion';
import {
    TrendingUp,
    AlertCircle,
    Lightbulb,
    CheckCircle2,
    Target,
    ArrowRight,
    Trophy,
    MessageSquare,
    Zap,
    Download,
    Share2,
    Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIAnalysisReportProps {
    data: {
        score: number;
        summary: string;
        strengths: string[];
        improvements: string[];
        tips: string[];
    };
    role: string;
}

export default function AIAnalysisReport({ data, role }: AIAnalysisReportProps) {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-[#050505]/90 backdrop-blur-2xl flex items-center justify-center p-8 overflow-y-auto"
        >
            <div className="max-w-6xl w-full bg-black/40 border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col min-h-[85vh]">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

                {/* Header */}
                <header className="p-10 border-b border-white/5 flex items-center justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                Performance Report
                            </div>
                            <span className="text-gray-600 font-bold text-[10px] uppercase tracking-widest">Version 2.5 • AI Forge</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white">Interview Analysis</h1>
                        <p className="text-gray-500 text-sm mt-2 font-medium">Session Evaluation: {role}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                            <Download className="w-5 h-5" />
                        </button>
                        <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-10 grid grid-cols-12 gap-8 relative z-10">
                    {/* Left Column: Score & Summary */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        {/* Score Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] p-8 text-center relative overflow-hidden group shadow-2xl shadow-indigo-500/20"
                        >
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <Trophy className="w-12 h-12 text-white/50 mx-auto mb-4" />
                                <div className="text-7xl font-black text-white mb-2 leading-none">{data.score}</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Overall Score</div>

                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">
                                        <span>Industry Rank</span>
                                        <span className="text-white">TOP 15%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${data.score}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-white shadow-[0_0_10px_white]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Summary Card */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/5 border border-white/10 rounded-[32px] p-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <MessageSquare className="w-5 h-5 text-indigo-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Interviewer Summary</span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed font-medium">
                                "{data.summary}"
                            </p>
                        </motion.div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        {/* Strengths & Improvements Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Strengths */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-green-500/5 border border-green-500/10 rounded-[32px] p-8"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Core Strengths</span>
                                </div>
                                <ul className="space-y-4">
                                    {data.strengths.map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 group">
                                            <div className="w-2 h-2 rounded-full bg-green-500/30 mt-1.5 group-hover:bg-green-500 transition-colors" />
                                            <span className="text-gray-300 text-sm font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Improvements */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="bg-red-500/5 border border-red-500/10 rounded-[32px] p-8"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Growth Areas</span>
                                </div>
                                <ul className="space-y-4">
                                    {data.improvements.map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 group">
                                            <div className="w-2 h-2 rounded-full bg-red-500/30 mt-1.5 group-hover:bg-red-500 transition-colors" />
                                            <span className="text-gray-300 text-sm font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>

                        {/* Pro Tips Section */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="bg-indigo-500/5 border border-indigo-500/10 rounded-[32px] p-8 overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Zap className="w-24 h-24 text-indigo-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <Lightbulb className="w-5 h-5 text-indigo-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">The Blueprint: Actionable Tips</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                {data.tips.map((tip, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-all cursor-default">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <span className="text-gray-300 text-xs font-medium">{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer Controls */}
                <footer className="p-10 border-t border-white/5 bg-white/[0.02] flex items-center justify-between relative z-10">
                    <button
                        onClick={() => navigate('/interview')}
                        className="flex items-center gap-3 text-gray-400 hover:text-white transition-all group"
                    >
                        <Home className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Return to Hub</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest"
                        >
                            Retake Session
                        </button>
                        <button
                            onClick={() => navigate('/problems')}
                            className="px-8 py-4 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 flex items-center gap-3"
                        >
                            Solve Recommended Problems
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </footer>
            </div>
        </motion.div>
    );
}
