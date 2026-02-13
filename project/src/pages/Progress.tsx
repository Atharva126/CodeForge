import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { format, subDays, subYears } from 'date-fns';
import {
    Trophy,
    Target,
    TrendingUp,
    Flame,
    CheckCircle,
    Activity,
    BarChart3,
    Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Progress() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        acceptanceRate: 0,
        streak: 0,
        totalSubmissions: 0
    });

    useEffect(() => {
        if (user) {
            fetchProgressData();
        }
    }, [user]);

    const fetchProgressData = async () => {
        try {
            setLoading(true);

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            const { data: subs } = await supabase
                .from('user_submissions')
                .select('*, problems(difficulty)')
                .eq('user_id', user?.id);

            const allSubmissions = (subs as any[]) || [];
            const acceptedSubmissions = allSubmissions.filter(s => s.status === 'Accepted');
            const totalSolved = new Set(acceptedSubmissions.map(s => s.problem_id)).size;

            const easySolved = new Set(acceptedSubmissions.filter(s => s.problems?.difficulty === 'easy' || s.problems?.difficulty === 'Easy').map(s => s.problem_id)).size;
            const mediumSolved = new Set(acceptedSubmissions.filter(s => s.problems?.difficulty === 'medium' || s.problems?.difficulty === 'Medium').map(s => s.problem_id)).size;
            const hardSolved = new Set(acceptedSubmissions.filter(s => s.problems?.difficulty === 'hard' || s.problems?.difficulty === 'Hard').map(s => s.problem_id)).size;

            const acceptanceRate = allSubmissions.length > 0
                ? Math.round((acceptedSubmissions.length / allSubmissions.length) * 100)
                : 0;

            // Heatmap Data
            const { data: acts } = await supabase
                .from('user_activity')
                .select('*')
                .eq('user_id', user?.id)
                .gte('created_at', subYears(new Date(), 1).toISOString());

            const dailyCounts: Record<string, number> = {};
            acts?.forEach(a => {
                const date = format(new Date(a.created_at), 'yyyy-MM-dd');
                dailyCounts[date] = (dailyCounts[date] || 0) + 1;
            });

            const heatmap = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
            setHeatmapData(heatmap);

            setStats({
                totalSolved,
                easySolved,
                mediumSolved,
                hardSolved,
                acceptanceRate,
                streak: profile?.streak || 0,
                totalSubmissions: allSubmissions.length
            });

        } catch (err) {
            console.error('Error fetching progress data:', err);
        } finally {
            setLoading(false);
        }
    };

    const difficultyData = [
        { name: 'Easy', value: stats.easySolved, color: '#10B981' },
        { name: 'Medium', value: stats.mediumSolved, color: '#F59E0B' },
        { name: 'Hard', value: stats.hardSolved, color: '#EF4444' },
    ];

    const activityGraphData = Array.from({ length: 14 }).map((_, i) => {
        const date = subDays(new Date(), 13 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = heatmapData.find(h => h.date === dateStr)?.count || 0;
        return { name: format(date, 'MMM d'), count };
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030712] text-white selection:bg-blue-500/30">
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/20 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/20 blur-[150px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/20">
                                <TrendingUp className="w-6 h-6 text-blue-400" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-blue-400">Activity & Growth</span>
                        </div>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter">My Progress</h1>
                        <p className="text-gray-400 mt-2">Visualizing your journey through CodeForge</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="p-1.5 bg-orange-500/20 rounded-lg">
                                <Flame className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">Current Streak</p>
                                <p className="text-xl font-black">{stats.streak} Days</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatsCard title="Total Solved" value={stats.totalSolved} icon={CheckCircle} color="text-green-400" bgColor="bg-green-400/10" />
                    <StatsCard title="Acceptance" value={`${stats.acceptanceRate}%`} icon={Target} color="text-blue-400" bgColor="bg-blue-400/10" />
                    <StatsCard title="Submissions" value={stats.totalSubmissions} icon={Activity} color="text-purple-400" bgColor="bg-purple-400/10" />
                    <StatsCard title="Rank" value="Top 15%" icon={Trophy} color="text-yellow-400" bgColor="bg-yellow-400/10" />
                </div>

                {/* Heatmap Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            Submission History
                        </h3>
                        <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-white/5"></div>
                                <div className="w-3 h-3 rounded-sm bg-blue-900/40"></div>
                                <div className="w-3 h-3 rounded-sm bg-blue-700/60"></div>
                                <div className="w-3 h-3 rounded-sm bg-blue-500/80"></div>
                                <div className="w-3 h-3 rounded-sm bg-blue-400"></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>

                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                        <div className="min-w-[800px]">
                            <CalendarHeatmap
                                startDate={subDays(new Date(), 365)}
                                endDate={new Date()}
                                values={heatmapData}
                                classForValue={(value) => {
                                    if (!value) return 'fill-white/5';
                                    if (value.count >= 4) return 'fill-blue-400';
                                    if (value.count >= 3) return 'fill-blue-500/80';
                                    if (value.count >= 2) return 'fill-blue-700/60';
                                    return 'fill-blue-900/40';
                                }}
                            />
                        </div>
                    </div>
                    <style>{`
            .react-calendar-heatmap rect { rx: 2px; }
            .react-calendar-heatmap { max-height: 120px; }
          `}</style>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Weekly Growth Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
                    >
                        <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                            Growth Momentum
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityGraphData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#030712', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Difficulty Split Pie */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center"
                    >
                        <h3 className="text-xl font-bold mb-8 w-full">Difficulty Mastery</h3>
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={difficultyData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={8}
                                        dataKey="value"
                                        cornerRadius={6}
                                    >
                                        {difficultyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#030712', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black">{stats.totalSolved}</span>
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Solved</span>
                            </div>
                        </div>

                        <div className="w-full space-y-3 mt-8">
                            {difficultyData.map(d => (
                                <div key={d.name} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-sm font-bold">{d.name}</span>
                                    </div>
                                    <span className="font-black">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl group hover:border-white/20 transition-all">
            <div className={`p-2 ${bgColor} rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{title}</p>
            <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
    );
}
