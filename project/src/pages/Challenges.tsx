import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { gamificationService, UserChallenge } from '../services/gamificationService';
import { Target, Clock, CheckCircle2, Coins, Zap } from 'lucide-react';

const Challenges = () => {
    const { user } = useAuth();
    const [challenges, setChallenges] = useState<UserChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    useEffect(() => {
        if (user) {
            loadChallenges();
        }
    }, [user]);

    const loadChallenges = async () => {
        try {
            setLoading(true);
            const data = await gamificationService.getUserChallenges(user!.id);
            setChallenges(data);
        } catch (error) {
            console.error('Error loading challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChallenges = challenges.filter(
        (c) => c.challenge?.category === activeTab
    );

    const getProgressPercentage = (current: number, target: number) => {
        return Math.min(100, Math.round((current / target) * 100));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="relative mb-12 text-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase italic">
                        Quest <span className="text-indigo-600 dark:text-indigo-400">Hub</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto uppercase tracking-widest text-xs">
                        Complete daily, weekly, and monthly challenges to earn forge coins and xp
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-10">
                    <div className="flex bg-gray-200 dark:bg-gray-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-300 dark:border-gray-800/50 shadow-inner">
                        {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 uppercase tracking-widest ${activeTab === tab
                                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-lg scale-105'
                                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Challenges Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 animate-pulse font-black text-xs uppercase tracking-widest">Scanning Quests...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredChallenges.length > 0 ? (
                            filteredChallenges.map((uc) => {
                                const percentage = getProgressPercentage(uc.current_value, uc.challenge?.target_value || 1);
                                return (
                                    <div
                                        key={uc.id}
                                        className={`group relative bg-white dark:bg-gray-900/40 backdrop-blur-md p-6 rounded-[32px] border transition-all duration-500 hover:scale-[1.02] ${uc.is_completed
                                            ? 'border-green-500/30 bg-green-50/10 dark:bg-green-500/5'
                                            : 'border-gray-200 dark:border-gray-800/50 hover:border-indigo-500/30'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-4 rounded-2xl ${uc.is_completed ? 'bg-green-500/20 text-green-500' : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'} transition-colors duration-500`}>
                                                {uc.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {uc.challenge?.title}
                                                    </h3>
                                                    {uc.is_completed && (
                                                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest animate-bounce">Completed</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4 leading-relaxed">
                                                    {uc.challenge?.description}
                                                </p>

                                                {/* Progress Bar */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-gray-400">Progress</span>
                                                        <span className={uc.is_completed ? 'text-green-500' : 'text-indigo-500 dark:text-indigo-400'}>
                                                            {uc.current_value} / {uc.challenge?.target_value}
                                                        </span>
                                                    </div>
                                                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-gray-700/50">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out relative ${uc.is_completed ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                                                }`}
                                                            style={{ width: `${percentage}%` }}
                                                        >
                                                            {!uc.is_completed && percentage > 10 && (
                                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Rewards */}
                                                <div className="flex gap-4 mt-6">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                                        <Coins className="w-3.5 h-3.5 text-yellow-500" />
                                                        <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest">+{uc.challenge?.coin_reward} Coins</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                                        <Zap className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">+{uc.challenge?.xp_reward} XP</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900/40 backdrop-blur-md rounded-[32px] border border-gray-200 dark:border-gray-800/50">
                                <Clock className="w-16 h-16 text-gray-300 dark:text-gray-800 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic mb-2">No active quests</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-widest">New challenges are drafted soon. Stay tuned!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Info */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-indigo-600 rounded-[32px] overflow-hidden relative shadow-2xl shadow-indigo-500/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 text-center md:text-left">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">Weekly Reset</h3>
                        <p className="text-indigo-100 text-sm font-bold opacity-80 uppercase tracking-widest">Challenge progress resets every Monday at 00:00 GMT</p>
                    </div>
                    <button
                        onClick={() => loadChallenges()}
                        className="relative z-10 px-8 py-3 bg-white text-indigo-600 font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-110 active:scale-95 transition-all shadow-xl"
                    >
                        Refresh Quests
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Challenges;
