import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Discussion } from '../types/discussion';
import { useAuth } from '../contexts/AuthContext';
import DiscussionCard from '../components/discussion/DiscussionCard';

export default function Discuss() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [userVotes, setUserVotes] = useState<Record<string, 1 | -1>>({});

  useEffect(() => {
    fetchDiscussions();
  }, [user]);

  const fetchDiscussions = async () => {
    const { data, error } = await supabase
      .from('discussions')
      .select('*, profiles:author_id(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching discussions:', error);
    } else {
      console.log('Fetched discussions:', data);
      setDiscussions(data || []);

      // Fetch user votes if logged in
      if (user && data && data.length > 0) {
        const { data: votes } = await supabase
          .from('discussion_votes')
          .select('discussion_id, vote_type')
          .eq('user_id', user.id)
          .in('discussion_id', data.map(d => d.id));

        if (votes) {
          const voteMap: Record<string, 1 | -1> = {};
          votes.forEach((v: any) => {
            voteMap[v.discussion_id] = v.vote_type;
          });
          setUserVotes(voteMap);
        }
      }
    }
    setLoading(false);
  };

  const handleVote = async (discussionId: string, type: 1 | -1) => {
    if (!user) return; // TODO: Show login prompt

    const currentVote = userVotes[discussionId];
    const isRemovingVote = currentVote === type;

    // Optimistic update
    const newVotes = { ...userVotes };
    if (isRemovingVote) {
      delete newVotes[discussionId];
    } else {
      newVotes[discussionId] = type;
    }
    setUserVotes(newVotes);

    // Update discussion counts locally
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d;

      let newUpvotes = d.upvotes;
      let newDownvotes = d.downvotes;

      // Remove old vote if exists
      if (currentVote === 1) newUpvotes--;
      if (currentVote === -1) newDownvotes--;

      // Add new vote if not removing
      if (!isRemovingVote) {
        if (type === 1) newUpvotes++;
        if (type === -1) newDownvotes++;
      }

      return { ...d, upvotes: newUpvotes, downvotes: newDownvotes };
    }));

    try {
      if (isRemovingVote) {
        await supabase
          .from('discussion_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('discussion_id', discussionId);
      } else {
        await supabase
          .from('discussion_votes')
          .upsert({
            user_id: user.id,
            discussion_id: discussionId,
            vote_type: type
          });
      }
    } catch (err) {
      console.error('Error voting:', err);
      // Revert changes on error (could implement full revert logic here)
      fetchDiscussions();
    }
  };

  const filteredDiscussions = discussions.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || d.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="pt-20 pb-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Discussion</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Join the community discussion. Share your thoughts and learn from others.
            </p>
          </div>
          <Link
            to="/discuss/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Discussion
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categories
                </h3>
                {['All', 'General', 'DSA', 'Web Dev', 'Interview Prep', 'Bugs'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filter === cat
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredDiscussions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No discussions found</div>
            ) : (
              filteredDiscussions.map((discussion) => (
                <DiscussionCard
                  key={discussion.id}
                  discussion={discussion}
                  userVote={userVotes[discussion.id]}
                  onVote={handleVote}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
