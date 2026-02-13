import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play, Bookmark } from 'lucide-react';
import { Problem } from '../data/problemsData';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Check } from 'lucide-react';

export default function Problems() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const [lists, setLists] = useState<any[]>([]);
  const [showListSelector, setShowListSelector] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedProblemItems, setSavedProblemItems] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchProblems();
    if (user) {
      fetchUserLists();
      fetchSavedItems();
    }
  }, [user]);

  const fetchUserLists = async () => {
    try {
      const { data, error } = await supabase
        .from('user_problem_lists')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      if (error) throw error;
      setLists(data || []);
    } catch (err) {
      console.error('Error fetching lists:', err);
    }
  };

  const fetchSavedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('user_problem_list_items')
        .select('list_id, problem_id');
      if (error) throw error;

      const mapping: Record<string, string[]> = {};
      data?.forEach(item => {
        if (!mapping[item.problem_id]) mapping[item.problem_id] = [];
        mapping[item.problem_id].push(item.list_id);
      });
      setSavedProblemItems(mapping);
    } catch (err) {
      console.error('Error fetching saved items:', err);
    }
  };

  const toggleSaveToList = async (problemId: string, listId: string) => {
    if (!user) return;
    try {
      setSaving(`${problemId}-${listId}`);
      const isSaved = savedProblemItems[problemId]?.includes(listId);

      if (isSaved) {
        const { error } = await supabase
          .from('user_problem_list_items')
          .delete()
          .eq('list_id', listId)
          .eq('problem_id', problemId);
        if (error) throw error;

        setSavedProblemItems(prev => ({
          ...prev,
          [problemId]: prev[problemId].filter(l => l !== listId)
        }));
      } else {
        const { error } = await supabase
          .from('user_problem_list_items')
          .insert([{ list_id: listId, problem_id: problemId }]);
        if (error) throw error;

        setSavedProblemItems(prev => ({
          ...prev,
          [problemId]: [...(prev[problemId] || []), listId]
        }));
      }
    } catch (err) {
      console.error('Error toggling list item:', err);
    } finally {
      setSaving(null);
    }
  };

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .order('id', { ascending: true }); // Or order by some other field

      if (error) {
        throw error;
      }

      if (data) {
        setProblems(data);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
      // Fallback to local data if DB fails (optional, but good for dev)
      // setProblems(problemsData); 
    } finally {
      setLoading(false);
    }
  };

  const getPlatformLogoPath = (platform: string) => {
    const logoMap: { [key: string]: string } = {
      'leetcode': 'leetcode.svg',
      'codechef': 'codechef-svgrepo-com.svg',
      'codeforces': 'code-forces.svg',
      'gfg': 'GeeksforGeeks_idFKvyQOZ__1.svg',
      'hackerrank': 'HackerRank_logo.svg',
      'codeforge': 'gemini_generated_image_98pvmv98pvmv98pv-removebg-preview (1).svg',
      'geeksforgeeks': 'GeeksforGeeks_idFKvyQOZ__1.svg'
    };
    return logoMap[platform] || `${platform}.svg`;
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || problem.difficulty === difficultyFilter;
    const matchesTag = tagFilter === 'all' || (problem.tags && problem.tags.includes(tagFilter));
    const matchesPlatform = platformFilter === 'all' || problem.platform === platformFilter;
    return matchesSearch && matchesDifficulty && matchesTag && matchesPlatform;
  });

  const allTags = Array.from(new Set(problems.flatMap((p) => p.tags)));
  const allPlatforms = Array.from(new Set(problems.map((p) => p.platform)));

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <img
                src="/gemini_generated_image_98pvmv98pvmv98pv-removebg-preview (1).svg"
                alt="CodeForge Logo"
                className="w-12 h-12 object-contain"
              />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Problems</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Practice coding problems and improve your skills</p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg inline-block">
            <span className="font-semibold">Total Problems: {problems.length}</span>
            <span className="text-blue-600 dark:text-blue-400 ml-2">({problems.length} problems available)</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms</option>
              {allPlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading problems...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acceptance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProblems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <Link to={`/problem/${problem.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {problem.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${problem.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                        : problem.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        }`}>
                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={`/${getPlatformLogoPath(problem.platform)}`}
                          alt={problem.platform}
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          {problem.platform.charAt(0).toUpperCase() + problem.platform.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {problem.acceptance_rate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {problem.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/solve/${problem.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Solve
                        </Link>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setShowListSelector(showListSelector === problem.id ? null : problem.id)}
                            className={`p-1.5 rounded-lg transition-colors ${savedProblemItems[problem.id]?.length > 0
                              ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            title="Save to List"
                          >
                            <Bookmark className={`w-5 h-5 ${savedProblemItems[problem.id]?.length > 0 ? 'fill-current' : ''}`} />
                          </button>

                          {showListSelector === problem.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 p-2 overflow-hidden backdrop-blur-xl">
                              <div className="p-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Add to List</span>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {lists.length > 0 ? (
                                  lists.map((list) => (
                                    <button
                                      key={list.id}
                                      onClick={() => toggleSaveToList(problem.id, list.id)}
                                      disabled={saving === `${problem.id}-${list.id}`}
                                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                                    >
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pr-2 truncate">
                                        {list.name}
                                      </span>
                                      {saving === `${problem.id}-${list.id}` ? (
                                        <div className="w-3 h-3 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                      ) : savedProblemItems[problem.id]?.includes(list.id) ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-4 text-center">
                                    <p className="text-xs text-gray-500 mb-2">No lists found.</p>
                                    <Link to="/my-lists" className="text-xs text-indigo-500 font-bold hover:underline">
                                      Create one
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
