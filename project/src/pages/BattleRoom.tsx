import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Trophy,
    Timer,
    Shield,
    Sword,
    Zap,
    ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Battle {
    id: string;
    player1: { username: string; id: string };
    player2: { username: string; id: string };
    status: 'waiting' | 'active' | 'completed';
    problem_count: number;
    duration: number;
    winner_id?: string;
    created_at: string;
}

interface BattleProblem {
    id: string;
    title: string;
    difficulty: string;
    order: number;
}

export default function BattleRoom() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [battle, setBattle] = useState<Battle | null>(null);
    const [problems, setProblems] = useState<BattleProblem[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [submissions, setSubmissions] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            loadBattleData();
            loadSubmissions();

            // Subscribe to new submissions for this battle
            const subscription = supabase
                .channel(`battle_submissions_${id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_submissions',
                    filter: `battle_id=eq.${id}`
                }, (payload) => {
                    setSubmissions((prev) => [...prev, payload.new]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [id]);

    useEffect(() => {
        if (battle?.status === 'active' && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [battle?.status, timeLeft]);

    const loadBattleData = async () => {
        try {
            setLoading(true);
            const { data: battleData, error: battleError } = await supabase
                .from('battles')
                .select(`
          *,
          player1:player1_id ( id, username ),
          player2:player2_id ( id, username )
        `)
                .eq('id', id)
                .single();

            if (battleError) throw battleError;
            setBattle(battleData);

            // Load problems
            const { data: bpData, error: bpError } = await supabase
                .from('battle_problems')
                .select(`
          problem:problem_id ( id, title, difficulty )
        `)
                .eq('battle_id', id);

            if (bpError) throw bpError;

            const transformedProblems = bpData.map((bp: any, index: number) => ({
                id: bp.problem.id,
                title: bp.problem.title,
                difficulty: bp.problem.difficulty,
                order: index
            }));
            setProblems(transformedProblems);

            // Initial timer
            if (battleData.status === 'active') {
                const start = new Date(battleData.created_at).getTime();
                const end = start + battleData.duration * 60000;
                const now = new Date().getTime();
                setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
            } else if (battleData.status === 'waiting') {
                setTimeLeft(battleData.duration * 60);
            }
        } catch (err) {
            console.error('Error loading battle:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSubmissions = async () => {
        if (!id) return;
        const { data, error } = await supabase
            .from('user_submissions')
            .select('*')
            .eq('battle_id', id)
            .eq('status', 'Accepted');

        if (!error && data) {
            setSubmissions(data);
        }
    };

    const handleJoinBattle = async () => {
        if (!battle || !user) return;
        try {
            const { error } = await supabase
                .from('battles')
                .update({ status: 'active' })
                .eq('id', battle.id);

            if (error) throw error;
            setBattle({ ...battle, status: 'active' });
        } catch (err) {
            console.error('Error joining battle:', err);
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-gray-400">Loading battle arena...</div>
            </div>
        );
    }

    if (!battle) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Battle not found</h2>
                    <Link to="/contests" className="text-blue-400 hover:underline">Back to Contests</Link>
                </div>
            </div>
        );
    }

    const isPlayer = user && (user.id === battle.player1.id || user.id === battle.player2.id);
    const isOpponent = user && user.id === battle.player2.id;
    const canStart = isOpponent && battle.status === 'waiting';

    const player1Solved = Array.from(new Set(submissions
        .filter(s => s.user_id === battle.player1.id)
        .map(s => s.problem_id)
    ));

    const player2Solved = Array.from(new Set(submissions
        .filter(s => s.user_id === battle.player2?.id)
        .map(s => s.problem_id)
    ));

    const getProblemStatus = (problemId: string, userId: string) => {
        return submissions.some(s => s.problem_id === problemId && s.user_id === userId);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center p-0.5">
                                    <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center font-bold text-xl">
                                        {battle.player1.username[0].toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400">Challenger</div>
                                    <div className="font-bold text-lg">{battle.player1.username}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-500 font-bold text-2xl italic">
                                VS
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center p-0.5">
                                    <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center font-bold text-xl">
                                        {battle.player2?.username[0].toUpperCase() || '?'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400">Opponent</div>
                                    <div className="font-bold text-lg">{battle.player2?.username || 'Waiting...'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <div className="text-sm text-gray-400 mb-1 flex items-center gap-2 justify-center">
                                    <Timer className="w-4 h-4" />
                                    Time Remaining
                                </div>
                                <div className={`text-3xl font-mono font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>

                            {canStart && (
                                <button
                                    onClick={handleJoinBattle}
                                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105"
                                >
                                    <Sword className="w-5 h-5" />
                                    Accept & Start
                                </button>
                            )}

                            {battle.status === 'waiting' && !isOpponent && (
                                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 px-4 py-2 rounded-lg text-sm">
                                    Waiting for opponent to accept...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content: Problems */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Shield className="w-6 h-6 text-blue-500" />
                                Battle Mission
                            </h2>
                            <span className="text-gray-400">{problems.length} Problems to Solve</span>
                        </div>

                        <div className="grid gap-4">
                            {problems.map((problem, idx) => (
                                <div
                                    key={problem.id}
                                    className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-400">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl group-hover:text-blue-400 transition-colors">
                                                    {problem.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${problem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' :
                                                        problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            'bg-red-500/10 text-red-500'
                                                        }`}>
                                                        {problem.difficulty}
                                                    </span>
                                                    <span className="text-xs text-gray-500">Solve to earn points</span>
                                                </div>
                                            </div>
                                        </div>

                                        {battle.status === 'active' && isPlayer ? (
                                            <Link
                                                to={`/solve/${problem.id}?battle=${battle.id}`}
                                                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-all"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </Link>
                                        ) : (
                                            <div className="text-gray-600 italic text-sm">
                                                Waiting for battle to start...
                                            </div>
                                        )}

                                        {battle.status === 'active' && (
                                            <div className="flex gap-2">
                                                <div className={`w-3 h-3 rounded-full ${getProblemStatus(problem.id, battle.player1.id) ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-800'}`} title={`${battle.player1.username}'s status`}></div>
                                                <div className={`w-3 h-3 rounded-full ${battle.player2 && getProblemStatus(problem.id, battle.player2.id) ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gray-800'}`} title={`${battle.player2?.username || 'Opponent'}'s status`}></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar: Progress & Info */}
                    <div className="space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                Live Standings
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{battle.player1.username}</span>
                                        <span className="text-blue-400 font-bold">{player1Solved.length}/{problems.length}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            style={{ width: `${(player1Solved.length / problems.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{battle.player2?.username || 'Opponent'}</span>
                                        <span className="text-red-400 font-bold">{player2Solved.length}/{problems.length}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                            style={{ width: `${(player2Solved.length / problems.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4">Battle Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Mode</span>
                                    <span className="font-medium">Classic</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Duration</span>
                                    <span className="font-medium">{battle.duration} Minutes</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Accepted</span>
                                    <span className="font-medium">{battle.status === 'active' ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Trophy className="w-5 h-5 text-blue-500" />
                                <h4 className="font-bold">Victory Goal</h4>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Be the first to solve all problems accurately within the time limit to claim your victory and rewards!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
