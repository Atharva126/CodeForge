import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Trophy,
    Clock,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Target,
    BarChart3,
    ExternalLink,
    ArrowLeft
} from 'lucide-react';
import { useMockSession } from '../contexts/MockSessionContext';

export default function MockResults() {
    const navigate = useNavigate();
    const { session, quitSession } = useMockSession();

    if (!session) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                    <TrendingUp className="w-8 h-8 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-black mb-4 text-white">No session data found</h2>
                <button
                    onClick={() => navigate('/interview')}
                    className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all"
                >
                    Return to Hub
                </button>
            </div>
        );
    }

    const { score, totalTimeTaken, solvedCount, accuracy } = useMemo(() => {
        const solved = Object.values(session.status).filter(s => s === 'solved').length;
        const total = session.problems.length;
        const timeTaken = Math.floor((Date.now() - (session.startTime || 0)) / 1000);
        const scoreVal = (solved / total) * 1000 - (timeTaken / 360); // Base 1000 minus time penalty

        return {
            solvedCount: solved,
            totalCount: total,
            totalTimeTaken: timeTaken,
            score: Math.max(0, Math.round(scoreVal)),
            accuracy: Math.round((solved / total) * 100)
        };
    }, [session]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30 py-16 px-4 sm:px-6 lg:px-8">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative max-w-4xl mx-auto">
                <header className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/20"
                    >
                        <Trophy className="w-12 h-12 text-white" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
                    >
                        Assessment Complete!
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-lg"
                    >
                        You've completed the {session.companyName} session. Here's a breakdown of your performance.
                    </motion.p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: 'Total Score', value: score, icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                        { label: 'Time Taken', value: formatTime(totalTimeTaken), icon: Clock, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                        { label: 'Accuracy', value: `${accuracy}%`, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
                        >
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</div>
                            <div className="text-3xl font-black">{stat.value}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Performance Graph & Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-400" />
                                Performance Graph
                            </h3>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Time vs Average</span>
                        </div>
                        <div className="h-48 flex items-end justify-between gap-4 mt-8 relative">
                            {/* Simplified SVG Graph */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                {/* Average Path (dotted) */}
                                <path d="M0 80 Q 100 60, 200 70 T 400 50" fill="none" stroke="#333" strokeWidth="2" strokeDasharray="4 4" />
                                {/* User Path */}
                                <path
                                    d={`M0 100 Q 100 ${100 - (accuracy * 0.8)}, 200 ${80 - (score / 20)} T 400 40`}
                                    fill="none"
                                    stroke="url(#grad)"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#818cf8" />
                                        <stop offset="100%" stopColor="#c084fc" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="w-full h-[1px] bg-white/10 absolute bottom-0" />
                            <div className="absolute -bottom-6 left-0 text-[10px] font-bold text-gray-600 uppercase">Start</div>
                            <div className="absolute -bottom-6 right-0 text-[10px] font-bold text-gray-600 uppercase">Finish</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl"
                    >
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            Insights
                        </h3>
                        <div className="space-y-6">
                            {[
                                { title: 'Speed', detail: 'You finished 15% faster than typical users for this role.', status: 'positive' },
                                { title: 'Consistency', detail: 'Your code quality was high with minimal runtime errors.', status: 'positive' },
                                { title: 'Growth Area', detail: 'Consider optimizing space complexity for Question 2.', status: 'neutral' }
                            ].map((insight, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${insight.status === 'positive' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                    <div>
                                        <div className="text-sm font-bold mb-1">{insight.title}</div>
                                        <div className="text-xs text-gray-500 leading-relaxed">{insight.detail}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Problem Results */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-xl mb-12"
                >
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-xl font-black">Problem Breakdown</h3>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{solvedCount}/{session.problems.length} Solved</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {session.problems.map((problem) => (
                            <div key={problem.id} className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${session.status[problem.id] === 'solved' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                        {session.status[problem.id] === 'solved' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold mb-1">{problem.title}</div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${problem.difficulty === 'easy' ? 'text-green-400' : problem.difficulty === 'medium' ? 'text-orange-400' : 'text-red-400'}`}>
                                                {problem.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/problem/${problem.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    View Solution
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Footer Actions */}
                <footer className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                    <button
                        onClick={() => { quitSession(); navigate('/interview'); }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all font-bold group"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:-translate-x-1 transition-transform" />
                        Back to Hub
                    </button>
                    <button
                        onClick={() => { quitSession(); navigate('/interview'); }}
                        className="w-full sm:w-auto px-12 py-4 rounded-2xl bg-indigo-500 text-white font-black hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 uppercase tracking-widest"
                    >
                        Finish Training
                    </button>
                </footer>
            </div>
        </div>
    );
}
