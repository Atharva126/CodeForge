import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Brain,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Award,
  ChevronRight,
  Timer,
  CheckCircle
} from 'lucide-react';

export default function Interview() {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [sessions, setSessions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSessions();
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTemplates(data);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSessions(data);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (template: any) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert([{
          user_id: user.id,
          title: template.title,
          difficulty: template.difficulty,
          duration: template.duration,
          questions_count: template.questions_count,
          category: template.category,
          completed: false
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setSessions([data, ...sessions]);
        // Ideally navigate to a chat page with the AI, but for now we just refresh.
        alert(`New interview session started: ${template.title}`);
      }
    } catch (err) {
      console.error('Error starting interview:', err);
    }
  };

  const categories = ['all', 'Technical', 'System Design', 'Behavioral', 'Database'];
  const difficulties = ['all', 'Easy', 'Medium', 'Hard'];

  const filteredSessions = sessions.filter(session => {
    const categoryMatch = selectedCategory === 'all' || session.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || session.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const stats = {
    completed: sessions.filter(s => s.completed).length,
    avgScore: sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.score || 0), 0) / sessions.length)
      : 0,
    totalTime: Math.round(sessions.reduce((acc, s) => acc + parseFloat(s.duration || '0'), 0) * 10) / 10,
    improvement: '+15%' // Mocked for now
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Interview Simulator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Practice with AI-powered mock interviews tailored to your skill level
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Sessions Completed</div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgScore}%</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Average Score</div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTime}h</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Total Practice Time</div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-orange-500 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.improvement}</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Improvement Rate</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Difficulties' : difficulty}
                  </option>
                ))}
              </select>
            </div>

            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-end">
              Start New Session
            </button>
          </div>
        </div>

        {/* Interview Templates Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              Available Practice Hub
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-100 dark:bg-gray-900/50 rounded-xl animate-pulse" />
              ))
            ) : (
              templates.map(template => (
                <div key={template.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col hover:border-indigo-500/50 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 capitalize bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                      {template.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-500 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {template.duration}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {template.questions_count} Qs</span>
                    </div>
                    <button
                      onClick={() => handleStartInterview(template)}
                      className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                      START
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* History / Sessions Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Your Sessions History
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-12 border border-gray-200 dark:border-gray-800 text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No session history yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Pick a template above and start practicing!
              </p>
            </div>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {session.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(session.difficulty)}`}>
                        {session.difficulty}
                      </span>
                      {session.completed && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {session.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {session.questions_count} questions
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {session.score ? `${session.score}%` : 'Not attempted'}
                      </div>
                    </div>
                  </div>

                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    {session.completed ? 'Review' : 'Start'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
