import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Trophy,
    Clock,
    Users,
    Play,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    List
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Contest {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    duration: number;
    status: 'upcoming' | 'ongoing' | 'ended';
    creator_id: string;
}

interface Problem {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    acceptance_rate: number;
}

export default function ContestDetail() {
    const { slug } = useParams<{ slug: string }>();
    const [contest, setContest] = useState<Contest | null>(null);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const { user } = useAuth();

    useEffect(() => {
        loadContest();
    }, [slug]);

    const loadContest = async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Load contest details
            const { data: contestData, error: contestError } = await supabase
                .from('contests')
                .select('*')
                .eq('slug', slug)
                .single();

            if (contestError) throw contestError;
            setContest(contestData);

            // 2. Load problems for this contest
            const { data: problemsData, error: problemsError } = await supabase
                .from('contest_problems')
                .select(`
          problem:problem_id (
            id,
            title,
            difficulty,
            acceptance_rate
          )
        `)
                .eq('contest_id', contestData.id)
                .order('order', { ascending: true });

            if (problemsError) throw problemsError;

            if (problemsData) {
                const validProblems = problemsData
                    .map((p: any) => p.problem)
                    .filter((p: any) => p !== null);
                setProblems(validProblems);
            }

        } catch (err: any) {
            console.error('Error loading contest:', err);
            setError(err.message || 'Failed to load contest');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!contest) return;

        const timer = setInterval(() => {
            const now = new Date();
            const start = new Date(contest.start_time);
            const end = new Date(contest.end_time);

            if (now < start) {
                const diff = start.getTime() - now.getTime();
                setTimeLeft(`Starts in: ${formatTime(diff)}`);
            } else if (now < end) {
                const diff = end.getTime() - now.getTime();
                setTimeLeft(`Ends in: ${formatTime(diff)}`);
            } else {
                setTimeLeft('Contest Ended');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [contest]);

    const formatTime = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleDeleteContest = async () => {
        if (!contest || !confirm('Are you sure you want to delete this contest? This action cannot be undone.')) {
            return;
        }
        try {
            const { error } = await supabase
                .from('contests')
                .delete()
                .eq('id', contest.id);
            if (error) throw error;
            window.location.href = '/contests';
        } catch (err: any) {
            console.error('Error deleting contest:', err);
            alert(`Failed to delete contest: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !contest) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center">{error || 'Contest not found'}</p>
                <Link to="/contests" className="mt-6 text-blue-600 hover:underline">Back to Contests</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                                <Trophy className="w-5 h-5" />
                                <span className="font-semibold uppercase tracking-wider text-sm">Contest</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{contest.title}</h1>
                                {user?.id === contest.creator_id && (
                                    <button
                                        onClick={handleDeleteContest}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-900/50"
                                        title="Delete Contest"
                                    >
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </div>
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">{contest.description}</p>
                        </div>

                        <div className="flex flex-col items-end gap-3 text-right">
                            <div className={`px-4 py-3 rounded-xl border min-w-[200px] ${timeLeft === 'Contest Ended'
                                ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50'
                                }`}>
                                <div className={`flex items-center gap-2 mb-1 ${timeLeft === 'Contest Ended'
                                    ? 'text-gray-600 dark:text-gray-400'
                                    : 'text-blue-700 dark:text-blue-300'
                                    }`}>
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase">Status</span>
                                </div>
                                <div className={`text-2xl font-mono font-bold ${timeLeft === 'Contest Ended'
                                    ? 'text-gray-500 dark:text-gray-500'
                                    : 'text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {timeLeft}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 0 Registered</span>
                                <span className="flex items-center gap-1"><List className="w-4 h-4" /> {problems.length} Problems</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Problems List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contest Problems</h2>
                    </div>

                    <div className="grid gap-4">
                        {problems.length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No problems assigned to this contest yet.</p>
                            </div>
                        ) : (
                            problems.map((problem, index) => (
                                <div
                                    key={problem.id}
                                    className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                                {problem.title}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className={`text-xs font-semibold uppercase tracking-wider ${problem.difficulty === 'easy' ? 'text-green-500' :
                                                    problem.difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'
                                                    }`}>
                                                    {problem.difficulty}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Acceptance: {problem.acceptance_rate.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/solve/${problem.id}`}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                    >
                                        <Play className="w-4 h-4" />
                                        Solve
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Leaderboard/Activity Sidebar (Optional Future addition) */}
                <div className="mt-12 grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Contest Rules</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    Points are awarded based on problem difficulty and time taken.
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    Each wrong submission results in a small time penalty.
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    Final rankings are determined by total points earned.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Resources</h3>
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <span className="text-sm font-medium">Contest Discussion</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <span className="text-sm font-medium">Recent Submissions</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
