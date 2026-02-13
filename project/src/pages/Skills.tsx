import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip
} from 'recharts';
import {
    Sparkles, Shield, Target, Zap,
    ChevronRight, Brain,
    Code, Database, Layout, Search,
    Trophy, Star, Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Skills() {
    const { user } = useAuth();
    const [, setLoading] = useState(true);
    const [skillData, setSkillData] = useState<any[]>([]);
    const [aiRecommendation, setAiRecommendation] = useState('');
    const [solvedCount, setSolvedCount] = useState(0);

    useEffect(() => {
        if (user) {
            loadSkillData();
        }
    }, [user]);

    const loadSkillData = async () => {
        try {
            setLoading(true);
            const { data: subsDetailed } = await supabase
                .from('user_submissions')
                .select(`
          status,
          problems!inner (
            tags
          )
        `)
                .eq('user_id', user?.id)
                .eq('status', 'Accepted');

            const accepted = (subsDetailed as any[]) || [];
            setSolvedCount(accepted.length);

            const categories: Record<string, string[]> = {
                'Arrays & Hashing': ['array', 'hash-table', 'matrix', 'prefix-sum', 'sliding-window', 'two-pointers'],
                'Strings': ['string', 'string-matching'],
                'Basic Algos': ['math', 'sorting', 'binary-search', 'greedy', 'recursion', 'simulation'],
                'Adv. Algos': ['dynamic-programming', 'backtracking', 'divide-and-conquer', 'bit-manipulation'],
                'Data Structures': ['stack', 'queue', 'heap', 'linked-list', 'ordered-set', 'monotonic-stack'],
                'Graph & Tree': ['tree', 'binary-tree', 'graph', 'dfs', 'bfs', 'union-find', 'trie', 'segment-tree']
            };

            const skillCounts: Record<string, number> = {
                'Arrays & Hashing': 0,
                'Strings': 0,
                'Basic Algos': 0,
                'Adv. Algos': 0,
                'Data Structures': 0,
                'Graph & Tree': 0
            };

            accepted.forEach(s => {
                const problemTags = s.problems?.tags || [];
                Object.entries(categories).forEach(([category, tags]) => {
                    if (problemTags.some((tag: string) => tags.includes(tag))) {
                        skillCounts[category] += 1;
                    }
                });
            });

            const maxVal = Math.max(...Object.values(skillCounts), 1);
            const formattedSkills = Object.entries(skillCounts).map(([name, value]) => ({
                name,
                value: Math.min(100, Math.round((value / maxVal) * 80) + 20),
                raw: value,
                level: Math.floor(value / 5) + 1
            }));

            setSkillData(formattedSkills);

            const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
            if (accepted.length > 0) {
                setAiRecommendation(`Your ${sortedSkills[0][0]} skill is impressive! To improve further, try focusing on ${sortedSkills[sortedSkills.length - 1][0]} problems.`);
            } else {
                setAiRecommendation("Start solving problems to get personalized AI insights into your coding profile.");
            }

        } catch (err) {
            console.error('Error loading skill data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Arrays & Hashing': return <Layout className="w-5 h-5" />;
            case 'Strings': return <Code className="w-5 h-5" />;
            case 'Basic Algos': return <Brain className="w-5 h-5" />;
            case 'Adv. Algos': return <Zap className="w-5 h-5" />;
            case 'Data Structures': return <Database className="w-5 h-5" />;
            case 'Graph & Tree': return <Search className="w-5 h-5" />;
            default: return <Sparkles className="w-5 h-5" />;
        }
    };

    const getLevelColor = (level: number) => {
        if (level >= 10) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        if (level >= 5) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        return 'text-green-400 bg-green-500/10 border-green-500/20';
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white selection:bg-purple-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/20">
                                <Brain className="w-6 h-6 text-purple-400" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-purple-400">Skill Profiler</span>
                        </div>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter">Skill Radar</h1>
                        <p className="text-gray-400 mt-2">Comprehensive breakdown of your technical proficiency</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-4"
                    >
                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Total Solved</p>
                            <p className="text-2xl font-black text-white">{solvedCount}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Radar and AI Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[450px]"
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-400">
                                <Shield className="w-3 h-3" />
                                Live Analysis
                            </div>
                        </div>

                        <div className="w-full h-full min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                                    <PolarGrid stroke="#ffffff10" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Skills"
                                        dataKey="value"
                                        stroke="#a855f7"
                                        strokeWidth={3}
                                        fill="#a855f7"
                                        fillOpacity={0.4}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#030712', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent border border-purple-500/20 rounded-3xl p-8 backdrop-blur-xl group relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-500/20 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold">AI Recommendations</h3>
                                </div>
                                <p className="text-gray-300 leading-relaxed italic text-lg">
                                    "{aiRecommendation}"
                                </p>
                                <div className="mt-8 flex flex-col gap-3">
                                    <Link
                                        to="/problems"
                                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group/link"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-500/20 rounded-lg">
                                                <Target className="w-4 h-4 text-green-400" />
                                            </div>
                                            <span className="font-bold">Focus on Weaknesses</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link
                                        to="/explore"
                                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group/link"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                                <Star className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <span className="font-bold">Follow a Roadmap</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
                                <p className="text-xs text-gray-500 uppercase font-black">Peak Skill</p>
                                <p className="text-lg font-bold">Expert</p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <Award className="w-6 h-6 text-orange-500 mb-2" />
                                <p className="text-xs text-gray-500 uppercase font-black">Daily Streak</p>
                                <p className="text-lg font-bold">Active</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skill Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skillData.map((skill, index) => (
                        <motion.div
                            key={skill.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-purple-400 group-hover:scale-110 transition-transform">
                                    {getCategoryIcon(skill.name)}
                                </div>
                                <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getLevelColor(skill.level)}`}>
                                    Lvl {skill.level}
                                </div>
                            </div>

                            <h4 className="text-xl font-bold mb-1">{skill.name}</h4>
                            <p className="text-xs text-gray-500 font-bold mb-6">{skill.raw} Problems Mastered</p>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <span>Proficiency</span>
                                    <span>{skill.value}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${skill.value}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
