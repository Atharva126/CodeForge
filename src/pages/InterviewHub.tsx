import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Layout,
    Database,
    Brain,
    Briefcase,
    X,
    Zap,
    ChevronRight,
    Sparkles,
    Target,
    Monitor,
    Code
} from 'lucide-react';
import { useMockSession } from '../contexts/MockSessionContext';
import { problemsData } from '../data/problemsData';

interface Role {
    id: string;
    title: string;
    category: string;
    description: string;
    topCompanies: string[];
    icon: React.ElementType;
    difficulty: 'Junior' | 'Mid' | 'Senior';
    color: string;
}

const ROLES: Role[] = [
    {
        id: 'frontend',
        title: 'Frontend Engineer',
        category: 'Engineering',
        description: 'Master React, TypeScript, and modern CSS to build stunning user interfaces.',
        topCompanies: ['Google', 'Amazon', 'Stripe'],
        icon: Layout,
        difficulty: 'Mid',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'backend',
        title: 'Backend Developer',
        category: 'Engineering',
        description: 'Design scalable APIs, microservices, and robust database architectures.',
        topCompanies: ['Meta', 'Microsoft', 'Netflix'],
        icon: Database,
        difficulty: 'Senior',
        color: 'from-purple-500 to-indigo-500'
    },
    {
        id: 'data-scientist',
        title: 'Data Scientist',
        category: 'Data Science',
        description: 'Extract insights from data and build powerful machine learning models.',
        topCompanies: ['OpenAI', 'Tesla', 'Nvidia'],
        icon: Brain,
        difficulty: 'Mid',
        color: 'from-green-500 to-emerald-500'
    },
    {
        id: 'product-manager',
        title: 'Product Manager',
        category: 'Management',
        description: 'Lead product strategy, define roadmaps, and drive cross-functional teams.',
        topCompanies: ['Apple', 'Uber', 'Airbnb'],
        icon: Briefcase,
        difficulty: 'Senior',
        color: 'from-orange-500 to-pink-500'
    },
    {
        id: 'fullstack',
        title: 'Fullstack Developer',
        category: 'Engineering',
        description: 'Bridge the gap between frontend and backend with versatile development skills.',
        topCompanies: ['Vercel', 'Supabase', 'Railway'],
        icon: Zap,
        difficulty: 'Mid',
        color: 'from-yellow-500 to-orange-500'
    },
    {
        id: 'devops',
        title: 'DevOps Engineer',
        category: 'Infrastructure',
        description: 'Automate deployments, manage cloud infrastructure, and ensure reliability.',
        topCompanies: ['AWS', 'Cloudflare', 'DigitalOcean'],
        icon: Target,
        difficulty: 'Senior',
        color: 'from-red-500 to-rose-500'
    }
];

export default function InterviewHub() {
    const navigate = useNavigate();
    const { startSession } = useMockSession();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Junior' | 'Mid' | 'Senior'>('All');
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [showStartWarning, setShowStartWarning] = useState(false);
    const [showRoomLobby, setShowRoomLobby] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');

    const filteredRoles = ROLES.filter(role => {
        const matchesSearch = role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            role.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = selectedDifficulty === 'All' || role.difficulty === selectedDifficulty;
        return matchesSearch && matchesDifficulty;
    });

    const handleStartMock = (role: Role) => {
        setSelectedRole(role);
        setShowStartWarning(true);
    };

    const confirmStartMock = () => {
        if (!selectedRole) return;
        const mockProblems = problemsData.slice(0, 3);
        const company = selectedRole.topCompanies[Math.floor(Math.random() * selectedRole.topCompanies.length)];
        startSession(selectedRole.id, `${company} Mock`, mockProblems);
        navigate('/interview/mock');
    };

    const handleStartOnlineInterview = () => {
        setShowRoomLobby(true);
    };

    const handleCreateRoom = () => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        navigate(`/interview/online/${roomId}`);
    };

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinRoomId.trim().length >= 4) {
            navigate(`/interview/online/${joinRoomId.toUpperCase()}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <header className="mb-12 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4"
                    >
                        <Sparkles className="w-3 h-3" />
                        Interview Preparation Hub
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black mb-4 tracking-tight"
                    >
                        Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Career Hub</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 text-lg max-w-2xl"
                    >
                        Select a role to begin your practice journey. Use AI simulations or challenge yourself with structured mock assessments.
                    </motion.p>
                </header>

                {/* Controls Section */}
                <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative w-full md:w-96 group"
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search roles or categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-xl"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl"
                    >
                        {(['All', 'Junior', 'Mid', 'Senior'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => setSelectedDifficulty(level)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedDifficulty === level
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </motion.div>
                </div>

                {/* Roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {filteredRoles.map((role, index) => (
                            <motion.div
                                key={role.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedRole(role)}
                                className="group relative cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl blur-xl" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />

                                <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-white/20 transition-all duration-300 group-hover:-translate-y-1">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6 shadow-lg`}>
                                        <role.icon className="w-8 h-8 text-white" />
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{role.category}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                        <span className="text-xs font-medium text-gray-500">{role.difficulty}</span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">{role.title}</h3>
                                    <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                                        {role.description}
                                    </p>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-500 uppercase">
                                            Top Hiring Companies
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {role.topCompanies.map(company => (
                                                <span key={company} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-gray-300">
                                                    {company}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between group-hover:text-indigo-400 transition-colors">
                                        <span className="text-xs font-bold tracking-widest uppercase">Start Practice</span>
                                        <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {filteredRoles.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-24 text-center"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-gray-700" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No roles found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                    </motion.div>
                )}
            </div>

            {/* Role Detail Modal */}
            <AnimatePresence>
                {selectedRole && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRole(null)}
                            className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            <div className={`h-32 bg-gradient-to-br ${selectedRole.color} relative`}>
                                <button
                                    onClick={() => setSelectedRole(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="absolute -bottom-10 left-8 w-20 h-20 rounded-3xl bg-gray-900 border-4 border-gray-900 p-4 shadow-xl">
                                    <div className={`w-full h-full rounded-xl bg-gradient-to-br ${selectedRole.color} flex items-center justify-center`}>
                                        <selectedRole.icon className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-14 p-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{selectedRole.category}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="text-xs font-medium text-gray-500">{selectedRole.difficulty}</span>
                                </div>
                                <h2 className="text-2xl font-black mb-4">{selectedRole.title}</h2>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    {selectedRole.description}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <button
                                        onClick={() => handleStartMock(selectedRole)}
                                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Sparkles className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <Code className="w-8 h-8 text-indigo-400" />
                                        <div className="text-center">
                                            <div className="font-bold">Mock Assessment</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest text-center">Structured Session</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate(`/interview/ai/${selectedRole.id}`)}
                                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-indigo-500 border border-indigo-400 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/25 group overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 p-2">
                                            <Zap className="w-4 h-4 text-white/50 animate-pulse" />
                                        </div>
                                        <Brain className="w-8 h-8 text-white text-glow" />
                                        <div className="text-center">
                                            <div className="font-bold">AI Simulation</div>
                                            <div className="text-[10px] text-white/70 uppercase font-black tracking-widest">Start Agent</div>
                                        </div>
                                    </button>
                                </div>

                                <button
                                    onClick={handleStartOnlineInterview}
                                    className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                                >
                                    <Monitor className="w-5 h-5 text-purple-400" />
                                    <span className="font-bold text-sm">Online Interview</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full border-2 border-gray-900 bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                                            +12
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        Practicing now
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Start Assessment Warning Modal */}
            <AnimatePresence>
                {showStartWarning && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowStartWarning(false)}
                            className="absolute inset-0 bg-gray-950/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-[32px] p-8 shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                                <Zap className="w-10 h-10 text-orange-500" />
                            </div>
                            <h3 className="text-2xl font-black mb-4">Ready to Start?</h3>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Once you begin the performance evaluation, <strong>the timer will start immediately</strong>. You cannot pause or restart the assessment after it begins.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowStartWarning(false)}
                                    className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={confirmStartMock}
                                    className="px-6 py-4 rounded-2xl bg-indigo-500 text-white font-black hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20"
                                >
                                    Start Now
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Room Lobby Modal */}
            <AnimatePresence>
                {showRoomLobby && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowRoomLobby(false)}
                            className="absolute inset-0 bg-gray-950/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                                    <Monitor className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Online Interview</h3>
                                <p className="text-gray-400 text-sm mb-8 font-medium">Host a new session to invite candidates or join an active room.</p>

                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        onClick={handleCreateRoom}
                                        className="flex items-center justify-between p-6 rounded-3xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 group text-left"
                                    >
                                        <div>
                                            <div className="font-black uppercase tracking-widest text-[10px] mb-1 opacity-70">Start Now</div>
                                            <div className="text-lg font-black">Host New Interview</div>
                                        </div>
                                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <div className="relative my-2">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-white/5"></div>
                                        </div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">
                                            <span className="bg-gray-900 px-4">OR</span>
                                        </div>
                                    </div>

                                    <form onSubmit={handleJoinRoom} className="space-y-4">
                                        <div className="relative group">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Enter Room ID (e.g. AX72B)"
                                                value={joinRoomId}
                                                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                                                className="w-full bg-white/5 border border-white/10 rounded-[20px] py-4 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-gray-700"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={joinRoomId.trim().length < 4}
                                            className="w-full py-4 rounded-[20px] bg-white text-gray-900 font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Join as Candidate
                                        </button>
                                    </form>
                                </div>

                                <button
                                    onClick={() => setShowRoomLobby(false)}
                                    className="mt-6 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
