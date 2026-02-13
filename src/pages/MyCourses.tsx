import { useEffect, useState } from 'react';
import { Book, Play, Sparkles, ArrowLeft, Search, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function MyCourses() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            const fetchCourses = async () => {
                try {
                    const { data, error } = await supabase
                        .from('user_order_items')
                        .select(`
                            store_items!inner (*)
                        `)
                        .eq('store_items.category', 'course');

                    if (error) throw error;

                    if (data) {
                        const courseList = data.map((c: any) =>
                            Array.isArray(c.store_items) ? c.store_items[0] : c.store_items
                        ).filter(Boolean);

                        const uniqueCourses = Array.from(new Map(courseList.map(c => [c.id, c])).values());
                        setCourses(uniqueCourses);
                    }
                } catch (err) {
                    console.error('Error fetching courses:', err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCourses();
        }
    }, [user]);

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#030712] transition-colors duration-300">
            {/* Header / Navbar section */}
            <div className="bg-white dark:bg-[#030712]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800/50 sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                                    My Courses
                                    <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30 font-bold uppercase tracking-widest">
                                        {courses.length}
                                    </span>
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Continue your learning journey</p>
                            </div>
                        </div>

                        <div className="relative group max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-indigo-500" />
                            <input
                                type="text"
                                placeholder="Search your courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-gray-900/50 border border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-gray-900 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 rounded-3xl bg-gray-100 dark:bg-gray-900/50 animate-pulse border border-gray-200 dark:border-gray-800/50" />
                        ))}
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map((course, idx) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-white dark:bg-[#0f172a]/40 backdrop-blur-sm rounded-[2rem] border border-gray-200 dark:border-gray-800/50 hover:border-indigo-500/50 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10"
                            >
                                {/* Background design element */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />

                                <div className="p-8 relative">
                                    <div className="w-14 h-14 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <GraduationCap className="w-7 h-7 text-indigo-500" />
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-500 transition-colors">
                                        {course.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 line-clamp-2 min-h-[2.5rem]">
                                        {course.description || "Master new skills with this comprehensive course covering advanced concepts and practical projects."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0f172a] bg-gray-200 dark:bg-gray-800" />
                                            ))}
                                            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0f172a] bg-indigo-500 flex items-center justify-center">
                                                <span className="text-[8px] font-bold text-white">+12</span>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/course-lab/${course.id}`}
                                            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xs rounded-xl hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            <Play className="w-3 h-3 fill-current" />
                                            CONTINUE
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-24">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900/50 rounded-full flex items-center justify-center mb-8">
                            <Book className="w-10 h-10 text-gray-300 dark:text-gray-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No courses found</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-xs">You haven't purchased any courses yet or your search matched nothing.</p>
                        <Link
                            to="/store"
                            className="px-8 py-4 bg-indigo-500 text-white font-black text-sm rounded-2xl hover:bg-indigo-600 shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 active:scale-95"
                        >
                            <Sparkles className="w-4 h-4" />
                            BROWSE STORE
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
