import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';
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
import { format, subDays } from 'date-fns';
import {
  Trophy,
  Target,
  TrendingUp,
  Flame,
  CheckCircle,
  Zap,
  Activity,
  Code,
  ArrowUpRight,
  Sparkles,
  Timer,
  Crown,
  Star,
  Award,
  Sword,
  Shield,
  Eye,
  Search,
  User
} from 'lucide-react';

interface Submission {
  id: string;
  problem_id: string;
  status: string;
  submitted_at: string;
  problems?: {
    title: string;
    difficulty: string;
  };
}

interface HeatmapValue {
  date: string;
  count: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapValue[]>([]);
  const [stats, setStats] = useState({
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    acceptanceRate: 0,
    streak: 0,
    thisWeekSolved: 0,
    totalSubmissions: 0
  });

  const [animatedStats, setAnimatedStats] = useState({
    problemsSolved: 0,
    currentRating: 1200, // Default starting rating
    globalRank: 0,
    acceptanceRate: 0
  });

  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile for rating and rank
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Fetch all submissions for stats
      const { data: subs } = await supabase
        .from('user_submissions')
        .select('*, problems(title, difficulty)')
        .eq('user_id', user?.id)
        .order('submitted_at', { ascending: false });

      const allSubmissions = subs as Submission[] || [];
      setSubmissions(allSubmissions);

      // Fetch recent user activity
      const { data: activityLogs } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and sort for the "Recent" feed
      // submissions have submitted_at, activityLogs have created_at
      const combinedFeed = [
        ...allSubmissions.slice(0, 10).map(s => ({
          id: s.id,
          type: 'submission',
          title: s.problems?.title || 'Problem Solved',
          status: s.status,
          date: s.submitted_at,
          icon: s.status === 'Accepted' ? 'check' : 'activity'
        })),
        ...(activityLogs || []).map(a => ({
          id: a.id,
          type: 'activity',
          title: a.title,
          status: a.action_type,
          date: a.created_at,
          icon: a.action_type === 'unlocked_badge' ? 'award' : 'zap'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setActivities(combinedFeed.slice(0, 6));

      // Calculate Stats
      const acceptedSubmissions = allSubmissions.filter(s => s.status === 'Accepted');
      const totalSolved = new Set(acceptedSubmissions.map(s => s.problem_id)).size;

      const easySolved = new Set(acceptedSubmissions.filter(s => s.problems?.difficulty === 'Easy').map(s => s.problem_id)).size;
      const mediumSolved = new Set(acceptedSubmissions.filter(s => s.problems?.difficulty === 'Medium').map(s => s.problem_id)).size;
      const hardSolved = new Set(acceptedSubmissions.filter(s => s.problems?.difficulty === 'Hard').map(s => s.problem_id)).size;

      const acceptanceRate = allSubmissions.length > 0
        ? Math.round((acceptedSubmissions.length / allSubmissions.length) * 100)
        : 0;

      // Calculate Heatmap Data
      const submissionDates = allSubmissions.map(s => s.submitted_at.split('T')[0]);
      const dateCounts: Record<string, number> = {};
      submissionDates.forEach(date => {
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      });

      const heatmap = Object.entries(dateCounts).map(([date, count]) => ({ date, count }));
      setHeatmapData(heatmap);

      const streak = profile?.streak || 0;

      // This week solved
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekSolvedCount = acceptedSubmissions.filter(s => new Date(s.submitted_at) > oneWeekAgo).length;

      setStats({
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        acceptanceRate,
        streak,
        thisWeekSolved: thisWeekSolvedCount,
        totalSubmissions: allSubmissions.length
      });

      setAnimatedStats({
        problemsSolved: totalSolved,
        currentRating: profile?.rating || 1200,
        globalRank: profile?.global_rank || 0,
        acceptanceRate
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTier = (rank: number) => {
    // Simplified logic for dashboard or fetch total users to match leaderboard
    const totalUsers = 1000; // Placeholder
    const percentile = ((totalUsers - rank) / totalUsers) * 100;

    if (rank === 1 || rank === 2 || rank === 3 || percentile >= 99) return 'Immortal';
    if (percentile >= 97) return 'Sovereign';
    if (percentile >= 93) return 'Apex';
    if (percentile >= 85) return 'Supreme';
    if (percentile >= 75) return 'Overlord';
    if (percentile >= 60) return 'Warlord';
    if (percentile >= 40) return 'Titan';
    if (percentile >= 25) return 'Alpha';
    if (percentile >= 10) return 'Predator';
    if (percentile >= 2) return 'Hunter';
    return 'Rookie';
  };

  const tier = getTier(animatedStats.globalRank || 1000);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Immortal': return <Crown className="w-5 h-5 text-yellow-400" />;
      case 'Sovereign': return <Trophy className="w-5 h-5 text-red-400" />;
      case 'Apex': return <Target className="w-5 h-5 text-orange-400" />;
      case 'Supreme': return <Star className="w-5 h-5 text-purple-400" />;
      case 'Overlord': return <Award className="w-5 h-5 text-pink-400" />;
      case 'Warlord': return <Sword className="w-5 h-5 text-red-500" />;
      case 'Titan': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'Alpha': return <Zap className="w-5 h-5 text-purple-500" />;
      case 'Predator': return <Eye className="w-5 h-5 text-green-400" />;
      case 'Hunter': return <Search className="w-5 h-5 text-cyan-400" />;
      default: return <User className="w-5 h-5 text-gray-400" />;
    }
  };

  const difficultyData = [
    { name: 'Easy', value: stats.easySolved, color: '#10B981' },
    { name: 'Medium', value: stats.mediumSolved, color: '#F59E0B' },
    { name: 'Hard', value: stats.hardSolved, color: '#EF4444' },
  ];

  // Activity Graph Data (Last 7 days)
  const activityGraphData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = heatmapData.find(h => h.date === dateStr)?.count || 0;
    return { name: format(date, 'EEE'), submissions: count };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-white font-bold text-sm">
            {payload[0].value} Submissions
          </p>
        </div>
      );
    }
    return null;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Code className="w-6 h-6 text-purple-500/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white relative overflow-hidden pb-20 selection:bg-purple-500/30 transition-colors duration-300">
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10s]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[7s]"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-pink-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[9s]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
        >
          <div className="relative group">
            {/* Animated Tier Icon Badge */}
            <div className="absolute -top-6 -left-6 z-20 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500 scale-125">
              <div className="relative p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl blur-xl animate-pulse"></div>
                <div className="relative z-10 flex items-center justify-center">
                  {getTierIcon(tier)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/20 backdrop-blur-xl transition-all group-hover:border-purple-500/40">
                <Code className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-black text-purple-600 dark:text-purple-300 uppercase tracking-widest shadow-lg shadow-purple-500/10">
                {tier} League
              </span>
            </div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-white dark:to-gray-500">
              Nexus
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2 font-medium">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">{user.email?.split('@')[0]}</span>
              <Sparkles className="w-4 h-4 text-yellow-500 animate-bounce" />
            </p>
          </div>

          <div className="flex gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 px-5 py-2.5 bg-white/80 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/5"
            >
              <div className="p-1.5 bg-orange-500/20 rounded-lg">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Streak</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{stats.streak} <span className="text-sm font-normal text-gray-500">days</span></p>
              </div>
            </motion.div>
            <Link
              to="/problems"
              className="group relative flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
            >
              <Zap className="w-5 h-5 transition-transform group-hover:-rotate-12" />
              Start Coding
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Problems Solved"
            value={stats.totalSolved}
            icon={CheckCircle}
            color="from-green-400 to-emerald-500"
            subtext={`Top ${stats.totalSolved > 0 ? '20%' : '-'} of users`}
            delay={0.1}
          />
          <StatsCard
            title="Acceptance Rate"
            value={`${stats.acceptanceRate}%`}
            icon={Target}
            color="from-blue-400 to-indigo-500"
            subtext={`${stats.totalSubmissions} total submissions`}
            delay={0.2}
          />
          <StatsCard
            title="Current Rating"
            value={animatedStats.currentRating}
            icon={Trophy}
            color="from-yellow-400 to-amber-500"
            subtext="Contest Rating"
            delay={0.3}
          />
          <StatsCard
            title="Global Rank"
            value={`#${animatedStats.globalRank || '-'}`}
            icon={TrendingUp}
            color="from-purple-400 to-pink-500"
            subtext=" improving"
            delay={0.4}
          />
        </div>

        {/* Main Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">

          {/* Activity Heatmap & Graph (Span 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none"
              style={{
                boxShadow: '0 0 40px -10px rgba(0,0,0,0.1)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Submission Map
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-gray-500 dark:text-gray-400">Less</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-sm bg-gray-200 dark:bg-[#1f2937]"></div>
                      <div className="w-4 h-4 rounded-sm bg-[#0e4429]"></div>
                      <div className="w-4 h-4 rounded-sm bg-[#006d32]"></div>
                      <div className="w-4 h-4 rounded-sm bg-[#26a641]"></div>
                      <div className="w-4 h-4 rounded-sm bg-[#39d353]"></div>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-gray-500 dark:text-gray-400">More</span>
                  </div>
                </div>
                <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                  <div className="min-w-[700px]">
                    <CalendarHeatmap
                      startDate={subDays(new Date(), 365)}
                      endDate={new Date()}
                      values={heatmapData}
                      gutterSize={3}
                      classForValue={(value) => {
                        if (!value) {
                          return 'fill-gray-200 dark:fill-gray-800/50 hover:fill-gray-300 dark:hover:fill-gray-800 transition-colors duration-200';
                        }
                        return `color-scale-${Math.min(value.count, 4)} hover:brightness-110 transition-all duration-200 transform hover:scale-110`;
                      }}
                      tooltipDataAttrs={(value: any) => ({
                        'data-tooltip-id': 'heatmap-tooltip',
                        'data-tooltip-content': value && value.date ? `${value.date}: ${value.count} submissions` : 'No submissions',
                      } as any)}
                    />
                    <ReactTooltip
                      id="heatmap-tooltip"
                      style={{
                        backgroundColor: '#0F172A',
                        color: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #1E293B',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
              </div>
              <style>{`
                  .react-calendar-heatmap text { font-size: 10px; fill: #6B7280; }
                  .react-calendar-heatmap .color-scale-1 { fill: #0e4429; }
                  .react-calendar-heatmap .color-scale-2 { fill: #006d32; }
                  .react-calendar-heatmap .color-scale-3 { fill: #26a641; }
                  .react-calendar-heatmap .color-scale-4 { fill: #39d353; }
                  .react-calendar-heatmap rect { rx: 3px; }
               `}</style>
            </motion.div>

            {/* Weekly Activity Graph */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Weekly Growth
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityGraphData}>
                    <defs>
                      <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#6B7280"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      stroke="#6B7280"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="submissions"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSubmissions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Difficulty & Recent (Col 3) */}
          <div className="space-y-8 flex flex-col">
            {/* Difficulty Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden flex-1 shadow-sm dark:shadow-none"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                Difficulty Split
              </h3>
              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      cornerRadius={6}
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.totalSolved}</span>
                  <span className="text-sm text-gray-500 uppercase tracking-widest font-medium">Solved</span>
                </div>
              </div>
              <div className="space-y-4 mt-6">
                <DifficultyRow label="Easy" count={stats.easySolved} total={stats.totalSolved} color="bg-[#10B981]" textColor="text-[#10B981]" />
                <DifficultyRow label="Medium" count={stats.mediumSolved} total={stats.totalSolved} color="bg-[#F59E0B]" textColor="text-[#F59E0B]" />
                <DifficultyRow label="Hard" count={stats.hardSolved} total={stats.totalSolved} color="bg-[#EF4444]" textColor="text-[#EF4444]" />
              </div>
            </motion.div>

            {/* Recent Submissions List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden flex-1 shadow-sm dark:shadow-none"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Recent Activity
              </h3>
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="group flex items-start justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/5">
                    <div className="flex gap-3">
                      <div className={`mt-1 p-1.5 rounded-lg ${act.icon === 'check' ? 'bg-green-500/20' :
                        act.icon === 'award' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                        }`}>
                        {act.icon === 'check' && <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />}
                        {act.icon === 'award' && <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                        {act.icon === 'zap' && <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                        {act.icon === 'activity' && <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-1">{act.title}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">{new Date(act.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${act.status === 'Accepted' || act.status === 'unlocked_badge'
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      }`}>
                      {act.status === 'unlocked_badge' ? 'Achievement' : act.status}
                    </span>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Code className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm">No recent activity.</p>
                    <Link to="/problems" className="text-purple-500 dark:text-purple-400 text-xs font-bold hover:underline mt-2 inline-block">Start Solving</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, subtext, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="relative p-6 bg-gray-900/40 border border-white/5 rounded-3xl backdrop-blur-xl group overflow-hidden"
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`}></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} bg-opacity-10 shadow-lg shadow-purple-900/20 ring-1 ring-white/10`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
        <div className="flex items-center gap-1.5 mt-3">
          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${color}`}></div>
          <p className="text-xs text-gray-500">{subtext}</p>
        </div>
      </div>
    </motion.div>
  )
}

function DifficultyRow({ label, count, total, color, textColor }: any) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="group">
      <div className="flex justify-between text-xs font-medium mb-2">
        <span className="text-gray-300">{label}</span>
        <span className={textColor}>{count} <span className="text-gray-600">/ {percentage}%</span></span>
      </div>
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} relative`}
        >
          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors"></div>
        </motion.div>
      </div>
    </div>
  )
}
