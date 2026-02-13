import { useEffect, useState } from 'react';
import { Search, Compass } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Roadmap } from '../types/explore';
import RoadmapCard from '../components/explore/RoadmapCard';

export default function Explore() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Language' | 'DSA' | 'Interview'>('All');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('roadmaps')
        .select('*')
        .order('created_at', { ascending: true });

      if (supabaseError) throw supabaseError;
      setRoadmaps(data || []);
    } catch (err: any) {
      console.error('Error fetching roadmaps:', err);
      // Simplify error message for user
      const msg = err.message || 'Failed to load roadmaps';
      setError(msg.includes('schema cache') ? 'Database is updating, please wait a moment and refresh.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoadmaps = roadmaps.filter((roadmap) => {
    const matchesCategory = activeCategory === 'All' || roadmap.category === activeCategory;
    const matchesSearch = roadmap.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Frontend', 'DSA', 'AI'];

  return (
    <div className="pt-20 pb-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
            <Compass className="w-10 h-10 text-blue-600" />
            Explore Learning Paths
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Master programming languages, data structures, and algorithms with our structured learning roadmaps.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search roadmaps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Connection Error</h3>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If you just ran the script, please wait 30 seconds and refresh.
            </p>
          </div>
        ) : filteredRoadmaps.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No roadmaps found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap.id} roadmap={roadmap} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
