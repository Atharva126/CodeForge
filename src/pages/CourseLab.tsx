import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Play,
    CheckCircle2,
    Circle,
    Code2,
    Trophy,
    ArrowLeft,
    Layout,
    MessageSquare,
    Sparkles,
    Lock,
    Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CourseAIAssistant from '../components/CourseAIAssistant';

interface Lesson {
    id: string;
    title: string;
    duration: string;
    video_url?: string;
    isCompleted?: boolean;
}

interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}

interface Course {
    id: string;
    name: string;
    instructor: string;
    modules: Module[];
}

export default function CourseLab() {
    const { courseId } = useParams();
    const { user } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

    useEffect(() => {
        if (user && courseId) {
            checkAccessAndFetchCourse();
        }
    }, [user, courseId]);

    const checkAccessAndFetchCourse = async () => {
        try {
            setLoading(true);

            // Verify purchase
            const { data: accessData } = await supabase
                .from('user_order_items')
                .select(`
          user_orders!inner (status, user_id)
        `)
                .eq('item_id', courseId)
                .eq('user_orders.user_id', user?.id)
                .eq('user_orders.status', 'completed')
                .maybeSingle();

            if (!accessData && user?.email !== 'admin@codeforge.com') {
                setHasAccess(false);
                setLoading(false);
                return;
            }
            setHasAccess(true);

            // Fetch course details from store_items
            const { data: storeItem } = await supabase
                .from('store_items')
                .select('*')
                .eq('id', courseId)
                .single();

            // Fetch curriculum from metadata or use fallback
            let curriculum: Module[] = storeItem.metadata?.curriculum;

            if (!curriculum || curriculum.length === 0) {
                // Mock curriculum fallback if not in metadata
                curriculum = [
                    {
                        id: 'm1',
                        title: 'Introduction & Environment Setup',
                        lessons: [
                            { id: 'l1', title: 'Welcome to the Course', duration: '5:00' },
                            { id: 'l2', title: 'Setting Up Your IDE', duration: '12:00' },
                            { id: 'l3', title: 'Language Fundamentals', duration: '18:00' },
                        ]
                    },
                    {
                        id: 'm2',
                        title: 'Core Concepts Deep Dive',
                        lessons: [
                            { id: 'l4', title: 'Data Structures 101', duration: '25:00' },
                            { id: 'l5', title: 'Algorithm Complexity', duration: '20:00' },
                        ]
                    }
                ];
            }

            // Fetch progress
            const { data: progressData } = await supabase
                .from('user_course_progress')
                .select('lesson_id')
                .eq('course_id', courseId)
                .eq('user_id', user?.id);

            const completedIds = new Set(progressData?.map(p => p.lesson_id) || []);

            const enrichedModules = curriculum.map(m => ({
                ...m,
                lessons: m.lessons.map(l => ({
                    ...l,
                    isCompleted: completedIds.has(l.id)
                }))
            }));

            setCourse({
                id: storeItem.id,
                name: storeItem.name,
                instructor: storeItem.instructor,
                modules: enrichedModules
            });

            setActiveLesson(enrichedModules[0].lessons[0]);

        } catch (error) {
            console.error('Error loading course lab:', error);
        } finally {
            setLoading(false);
        }
    };

    const [isClaiming, setIsClaiming] = useState(false);
    const [isClaimed, setIsClaimed] = useState(false);

    const checkCertificateStatus = async () => {
        if (!user || !courseId) return;
        const { data } = await supabase
            .from('user_certificates')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle();
        if (data) setIsClaimed(true);
    };

    useEffect(() => {
        if (user && courseId && hasAccess) {
            checkCertificateStatus();
        }
    }, [user, courseId, hasAccess]);

    const claimCertificate = async () => {
        if (!user || !course || isClaimed) return;
        setIsClaiming(true);
        try {
            const certId = `CF-${course.name.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const { error } = await supabase
                .from('user_certificates')
                .insert({
                    user_id: user.id,
                    course_id: course.id,
                    certificate_id: certId
                });

            if (error) {
                console.error('Supabase error claiming certificate:', error);
                alert(`Failed to claim certificate: ${error.message || 'Unknown database error'}`);
                return;
            }

            setIsClaimed(true);
        } catch (error: any) {
            console.error('Logic error claiming certificate:', error);
            alert(`Failed to claim certificate: ${error.message || 'An unexpected error occurred'}`);
        } finally {
            setIsClaiming(false);
        }
    };

    const toggleLessonCompletion = async (lesson: Lesson) => {
        if (!user || !course) return;

        try {
            if (lesson.isCompleted) {
                await supabase
                    .from('user_course_progress')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('course_id', course.id)
                    .eq('lesson_id', lesson.id);
            } else {
                await supabase
                    .from('user_course_progress')
                    .insert({
                        user_id: user.id,
                        course_id: course.id,
                        lesson_id: lesson.id
                    });
            }

            // Update local state
            setCourse(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    modules: prev.modules.map(m => ({
                        ...m,
                        lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, isCompleted: !l.isCompleted } : l)
                    }))
                };
            });

            if (activeLesson?.id === lesson.id) {
                setActiveLesson(prev => prev ? { ...prev, isCompleted: !prev.isCompleted } : null);
            }
        } catch (error) {
            console.error('Error toggling completion:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium">Entering Course Lab...</p>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
                <p className="text-gray-400 max-w-md mb-8">
                    You haven't purchased this course yet. Please visit the store to unlock this premium content.
                </p>
                <Link
                    to="/store"
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                    Explore Courses
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Top Navbar */}
            <nav className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Link
                        to="/dashboard"
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="h-6 w-px bg-gray-800 mx-2"></div>
                    <div className="flex items-center gap-3">
                        <img
                            src="/gemini_generated_image_98pvmv98pvmv98pv-removebg-preview (1).svg"
                            alt="CodeForge"
                            className="w-8 h-8 object-contain"
                        />
                        <div>
                            <h1 className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-md">
                                {course?.name}
                            </h1>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                {activeLesson?.title}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAIAssistantOpen(true)}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 text-xs font-bold transition-all hover:bg-indigo-500/20"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Assistant
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-32 bg-gray-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{
                                    width: `${(course?.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0) || 0) / (course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 1) * 100}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Curriculum */}
                <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 overflow-hidden`}>
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/80 sticky top-0 z-10">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Curriculum</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        {course?.modules.map((module) => (
                            <div key={module.id} className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    {module.title}
                                </h3>
                                <div className="space-y-1">
                                    {module.lessons.map((lesson) => (
                                        <button
                                            key={lesson.id}
                                            onClick={() => setActiveLesson(lesson)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${activeLesson?.id === lesson.id
                                                ? 'bg-indigo-500/10 border-indigo-500/30 text-white'
                                                : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                                                }`}
                                        >
                                            <div onClick={(e) => { e.stopPropagation(); toggleLessonCompletion(lesson); }}>
                                                {lesson.isCompleted ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-gray-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{lesson.title}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">{lesson.duration}</p>
                                            </div>
                                            {activeLesson?.id === lesson.id && (
                                                <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Toggle Sidebar Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute bottom-6 left-6 z-40 p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full border border-gray-700 shadow-2xl transition-all"
                >
                    {isSidebarOpen ? <Layout className="w-5 h-5 rotate-90" /> : <Layout className="w-5 h-5 -rotate-90" />}
                </button>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden bg-gray-950">
                    <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                        <div className="max-w-4xl mx-auto">
                            {/* Media Player Placeholder */}
                            <div className="aspect-video w-full bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden mb-12 group">
                                {activeLesson?.video_url ? (
                                    <div className="w-full h-full relative group/player">
                                        <iframe
                                            className="w-full h-full"
                                            src={`${activeLesson.video_url}${activeLesson.video_url.includes('?') ? '&' : '?'}origin=${window.location.origin}&enablejsapi=1`}
                                            title={activeLesson.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            allowFullScreen
                                        ></iframe>
                                        <div className="absolute top-4 right-4 opacity-0 group-hover/player:opacity-100 transition-opacity">
                                            <a
                                                href={activeLesson.video_url.replace('/embed/', '/watch?v=')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur text-white text-xs font-bold rounded-lg border border-white/10 hover:bg-red-600 transition-all"
                                            >
                                                <Play className="w-3 h-3 fill-current" />
                                                Watch on YouTube
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-100 transition-opacity"></div>
                                        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 hover:scale-110 transition-transform cursor-pointer relative z-10">
                                            <Play className="w-8 h-8 fill-current translate-x-1" />
                                        </div>
                                        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs font-bold text-gray-400 z-10">
                                            <span className="bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">Premium Content</span>
                                            <span className="bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">{activeLesson?.duration}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Lesson Text Content */}
                            <div className="space-y-8">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-800 pb-8">
                                    <div>
                                        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                                            {activeLesson?.title}
                                        </h1>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-1.5 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
                                                <BookOpen className="w-4 h-4" />
                                                <span>Lesson {(course?.modules.flatMap(m => m.lessons).findIndex(l => l.id === activeLesson?.id) ?? -1) + 1}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
                                                <Trophy className="w-4 h-4 text-yellow-500" />
                                                <span>+50 XP</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => activeLesson && toggleLessonCompletion(activeLesson)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-xl ${activeLesson?.isCompleted
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                                            : 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20'
                                            }`}
                                    >
                                        {activeLesson?.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 opacity-50" />}
                                        {activeLesson?.isCompleted ? 'Completed' : 'Mark as Complete'}
                                    </button>
                                </div>

                                <div className="prose prose-invert max-w-none">
                                    <p className="text-lg text-gray-400 leading-relaxed">
                                        Welcome to this module. In this lesson, we'll dive deep into the core mechanics of performance optimization and how to structure your code for maximum efficiency. We'll explore various patterns and best practices used by senior engineers at top tech companies.
                                    </p>

                                    <div className="my-10 p-8 rounded-3xl bg-gray-900/50 border border-gray-800 relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4">
                                            <Code2 className="w-12 h-12 text-gray-800 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-4">Hands-on Lab</h3>
                                        <p className="text-gray-400 mb-6">
                                            Try implementing the optimization pattern we discussed using the interactive playground below. Focus on reducing time complexity while maintaining readability.
                                        </p>
                                        <Link
                                            to="/playground"
                                            className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 group"
                                        >
                                            Open Lab Playground
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-4">Discussion & Feedback</h3>
                                    <p className="text-gray-400 mb-6">
                                        Have questions about this lesson? Join the discussion with other students and the instructor.
                                    </p>
                                    <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all border border-gray-700">
                                        <MessageSquare className="w-5 h-5" />
                                        Join Lesson Discussion
                                    </button>

                                    {/* Certification Section */}
                                    {course?.modules.every(m => m.lessons.every(l => l.isCompleted)) && (
                                        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 relative overflow-hidden group animate-in zoom-in-95 duration-500">
                                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                                                <Trophy className="w-24 h-24 text-indigo-400" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                                    <Sparkles className="w-5 h-5" />
                                                    <span className="text-sm font-black uppercase tracking-widest">Achieved</span>
                                                </div>
                                                <h3 className="text-3xl font-black text-white mb-4">Course Completed!</h3>
                                                <p className="text-gray-300 mb-8 max-w-lg leading-relaxed">
                                                    Congratulations! You've mastered all the concepts in this course. Claim your official verified certificate to showcase your expertise on your profile.
                                                </p>
                                                {isClaimed ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className="px-6 py-3 bg-green-500/20 text-green-400 rounded-2xl border border-green-500/30 font-bold flex items-center gap-2">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            Certificate Claimed
                                                        </div>
                                                        <Link to="/profile" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                                                            View in Profile
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={claimCertificate}
                                                        disabled={isClaiming}
                                                        className="px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-indigo-500/40 hover:scale-105 disabled:opacity-50 flex items-center gap-3"
                                                    >
                                                        {isClaiming ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Award className="w-6 h-6" />}
                                                        Claim Certificate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Navigation */}
                    <div className="h-20 border-t border-gray-800 px-8 flex items-center justify-between bg-gray-900/40 backdrop-blur-md">
                        <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors group">
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            Previous Lesson
                        </button>
                        <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors group">
                            Next Lesson
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </main>
            </div>

            <CourseAIAssistant
                isOpen={isAIAssistantOpen}
                onClose={() => setIsAIAssistantOpen(false)}
                courseName={course?.name}
                lessonTitle={activeLesson?.title}
            />
        </div>
    );
}
