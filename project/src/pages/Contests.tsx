import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  Trophy,
  Plus,
  Sword,
  UserPlus,
  Play,
  Zap,
  Shield,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: 'upcoming' | 'ongoing' | 'ended';
  creator_id: string;
}

interface Battle {
  id: string;
  player1: string;
  player2: string;
  status: 'waiting' | 'active' | 'completed';
  problem_count: number;
  duration: number;
  winner?: string;
}

export default function Contests() {
  const [activeTab, setActiveTab] = useState<'contests' | 'organize' | 'battle'>('contests');
  const [contests, setContests] = useState<Contest[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'ended'>('all');
  const [loading, setLoading] = useState(true);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const { user } = useAuth();

  // Create Contest Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    start_time: '',
    max_participants: 100,
    type: 'public' as 'public' | 'private' | 'invite_only'
  });
  const [creating, setCreating] = useState(false);

  // Battle Form State
  const [battleFormData, setBattleFormData] = useState({
    opponentUsername: '',
    problemCount: 3,
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard' | 'Mixed',
    duration: 30,
    mode: 'Classic' as 'Classic' | 'Speed' | 'Accuracy'
  });
  const [startingBattle, setStartingBattle] = useState(false);



  useEffect(() => {
    loadContests();
    loadBattles();
    if (user) {
      loadUserRegistrations();
    }
  }, [user]);

  const loadContests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;
      if (data) setContests(data);
    } catch (err) {
      console.error('Error loading contests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBattles = async () => {
    try {
      const { data, error } = await supabase
        .from('battles')
        .select(`
          *,
          player1:player1_id ( username ),
          player2:player2_id ( username ),
          winner:winner_id ( username )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const transformedData: Battle[] = data.map((b: any) => ({
          id: b.id,
          player1: b.player1?.username || 'Anonym',
          player2: b.player2?.username || 'Waiting...',
          status: b.status,
          problem_count: b.problem_count,
          duration: b.duration,
          winner: b.winner?.username
        }));
        setBattles(transformedData);
      }
    } catch (err) {
      console.error('Error loading battles:', err);
    }
  };

  const loadUserRegistrations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('contest_participants')
        .select('contest_id')
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) setUserRegistrations(data.map(r => r.contest_id));
    } catch (err) {
      console.error('Error loading registrations:', err);
    }
  };

  const handleRegister = async (contestId: string) => {
    if (!user) {
      alert('Please login to register for a contest');
      return;
    }
    try {
      const { error } = await supabase
        .from('contest_participants')
        .insert({ user_id: user.id, contest_id: contestId });

      if (error) throw error;
      setUserRegistrations([...userRegistrations, contestId]);
      alert('Successfully registered!');
    } catch (err: any) {
      alert(`Registration failed: ${err.message || 'Error joining'}`);
    }
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to create a contest');
      return;
    }

    if (!formData.title || !formData.start_time) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);

      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 7);

      const startTime = new Date(formData.start_time);
      const endTime = new Date(startTime.getTime() + formData.duration * 60000);

      const { data, error } = await supabase
        .from('contests')
        .insert({
          title: formData.title,
          slug,
          description: formData.description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration: formData.duration,
          max_participants: formData.max_participants,
          type: formData.type,
          creator_id: user.id,
          status: 'upcoming'
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically assign 3 random problems for demonstration
      const { data: randomProblems } = await supabase
        .from('problems')
        .select('id')
        .limit(3);

      if (randomProblems && randomProblems.length > 0) {
        const contestProblems = randomProblems.map((p, index) => ({
          contest_id: data.id,
          problem_id: p.id,
          order: index
        }));

        await supabase
          .from('contest_problems')
          .insert(contestProblems);
      }

      alert('Contest created successfully with 3 problems assigned!');

      setFormData({
        title: '',
        description: '',
        duration: 60,
        start_time: '',
        max_participants: 100,
        type: 'public'
      });
      loadContests();
      setActiveTab('contests');
    } catch (err: any) {
      console.error('Error creating contest:', err);
      alert(`Failed to create contest: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleStartBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to start a battle');
      return;
    }

    if (!battleFormData.opponentUsername) {
      alert('Please enter an opponent username');
      return;
    }

    try {
      setStartingBattle(true);

      // 1. Find opponent
      const { data: opponent, error: opponentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', battleFormData.opponentUsername)
        .single();

      if (opponentError || !opponent) {
        throw new Error('Opponent not found. Please check the username.');
      }

      if (opponent.id === user.id) {
        throw new Error('You cannot challenge yourself!');
      }

      // 2. Select random problems based on difficulty
      let query = supabase.from('problems').select('id');
      if (battleFormData.difficulty !== 'Mixed') {
        query = query.eq('difficulty', battleFormData.difficulty.toLowerCase());
      }
      const { data: problems, error: problemsError } = await query.limit(battleFormData.problemCount);

      if (problemsError || !problems || problems.length === 0) {
        throw new Error('Could not find enough problems for this difficulty.');
      }

      // 3. Create battle record
      const { data: battle, error: battleError } = await supabase
        .from('battles')
        .insert({
          player1_id: user.id,
          player2_id: opponent.id,
          status: 'waiting', // Start as waiting for opponent to join
          problem_count: battleFormData.problemCount,
          duration: battleFormData.duration,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (battleError) throw battleError;

      // 4. Link problems to battle
      const battleProblems = problems.map((p, index) => ({
        battle_id: battle.id,
        problem_id: p.id,
        order: index
      }));

      const { error: bpError } = await supabase
        .from('battle_problems')
        .insert(battleProblems);

      if (bpError) throw bpError;

      alert('Battle challenge sent! Waiting for opponent...');
      loadBattles();
      window.location.href = `/battle/${battle.id}`;
    } catch (err: any) {
      console.error('Error starting battle:', err);
      alert(err.message || 'Failed to start battle');
    } finally {
      setStartingBattle(false);
    }
  };

  const handleDeleteContest = async (contestId: string) => {
    if (!confirm('Are you sure you want to delete this contest? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contests')
        .delete()
        .eq('id', contestId);

      if (error) throw error;

      setContests(contests.filter(c => c.id !== contestId));
      alert('Contest deleted successfully');
    } catch (err: any) {
      console.error('Error deleting contest:', err);
      alert(`Failed to delete contest: ${err.message}`);
    }
  };


  const filteredContests = filter === 'all'
    ? contests
    : contests.filter(c => c.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Contests</h1>
          <p className="text-gray-600 dark:text-gray-400">Compete with coders worldwide and climb the leaderboard</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('contests')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'contests'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Contests
          </button>
          <button
            onClick={() => setActiveTab('organize')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'organize'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Organize Contest
          </button>
          <button
            onClick={() => setActiveTab('battle')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'battle'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <Sword className="w-4 h-4 inline mr-2" />
            Battle
          </button>
        </div>

        {/* Contests Tab */}
        {activeTab === 'contests' && (
          <>
            <div className="flex gap-4 mb-8">
              <FilterButton
                active={filter === 'all'}
                onClick={() => setFilter('all')}
                label="All Contests"
              />
              <FilterButton
                active={filter === 'upcoming'}
                onClick={() => setFilter('upcoming')}
                label="Upcoming"
              />
              <FilterButton
                active={filter === 'ongoing'}
                onClick={() => setFilter('ongoing')}
                label="Ongoing"
              />
              <FilterButton
                active={filter === 'ended'}
                onClick={() => setFilter('ended')}
                label="Ended"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading contests...</div>
              </div>
            ) : filteredContests.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-12 border border-gray-200 dark:border-gray-800 text-center">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No contests found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters or check back later for new contests
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredContests.map((contest) => (
                  <ContestCard
                    key={contest.id}
                    contest={contest}
                    onRegister={() => handleRegister(contest.id)}
                    isRegistered={userRegistrations.includes(contest.id)}
                    isCreator={user?.id === contest.creator_id}
                    onDelete={() => handleDeleteContest(contest.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Organize Contest Tab */}
        {activeTab === 'organize' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateContest} className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <Plus className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create a New Contest</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contest Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter contest name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your contest"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      placeholder="60"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 0 })}
                      placeholder="100"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contest Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="invite_only">Invite Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Contest'}
                </button>
                <button
                  type="button"
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Save as Draft
                </button>
              </div>
            </form>


            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Created Contests</h3>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">You haven't created any contests yet</p>
              </div>
            </div>
          </div>
        )}

        {/* Battle Tab */}
        {activeTab === 'battle' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <Sword className="w-6 h-6 text-red-500 dark:text-red-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Start a Battle</h2>
              </div>

              <form onSubmit={handleStartBattle} className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Challenge a Friend</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Friend's Username
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={battleFormData.opponentUsername}
                        onChange={(e) => setBattleFormData({ ...battleFormData, opponentUsername: e.target.value })}
                        placeholder="Enter username"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <UserPlus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Problems
                    </label>
                    <select
                      value={battleFormData.problemCount}
                      onChange={(e) => setBattleFormData({ ...battleFormData, problemCount: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={3}>3 Problems</option>
                      <option value={5}>5 Problems</option>
                      <option value={7}>7 Problems</option>
                      <option value={10}>10 Problems</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={battleFormData.difficulty}
                      onChange={(e) => setBattleFormData({ ...battleFormData, difficulty: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Battle Settings</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Battle Duration (minutes)
                    </label>
                    <select
                      value={battleFormData.duration}
                      onChange={(e) => setBattleFormData({ ...battleFormData, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Battle Mode
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value="Classic"
                          checked={battleFormData.mode === 'Classic'}
                          onChange={(e) => setBattleFormData({ ...battleFormData, mode: e.target.value as any })}
                          className="text-blue-600"
                        />
                        <span className="text-gray-900 dark:text-white">Classic - First to solve wins</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value="Speed"
                          checked={battleFormData.mode === 'Speed'}
                          onChange={(e) => setBattleFormData({ ...battleFormData, mode: e.target.value as any })}
                          className="text-blue-600"
                        />
                        <span className="text-gray-900 dark:text-white">Speed - Most problems in time wins</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value="Accuracy"
                          checked={battleFormData.mode === 'Accuracy'}
                          onChange={(e) => setBattleFormData({ ...battleFormData, mode: e.target.value as any })}
                          className="text-blue-600"
                        />
                        <span className="text-gray-900 dark:text-white">Accuracy - Highest accuracy wins</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={startingBattle}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 inline mr-2" />
                    {startingBattle ? 'Starting...' : 'Start Battle'}
                  </button>
                </div>
              </form>
            </div>


            {/* Active Battles */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Battles</h3>
              <div className="space-y-4">
                {battles.map((battle) => (
                  <div key={battle.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{battle.player1}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Challenger</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Sword className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">VS</span>
                          <Sword className="w-5 h-5 text-gray-400" />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{battle.player2}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Opponent</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${battle.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : battle.status === 'waiting'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                          {battle.status === 'active' ? 'In Progress' : battle.status === 'waiting' ? 'Waiting' : 'Completed'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {battle.problem_count} problems • {battle.duration} min
                        </div>
                        {battle.winner && (
                          <div className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            Winner: {battle.winner}
                          </div>
                        )}
                      </div>
                    </div>

                    {battle.status === 'active' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Link
                          to={`/battle/${battle.id}`}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block text-center"
                        >
                          <Zap className="w-4 h-4 inline mr-2" />
                          Join Battle Room
                        </Link>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
      {label}
    </button>
  );
}

function ContestCard({
  contest,
  onRegister,
  isRegistered,
  isCreator,
  onDelete
}: {
  contest: Contest;
  onRegister: () => void;
  isRegistered: boolean;
  isCreator: boolean;
  onDelete: () => void;
}) {
  const startDate = new Date(contest.start_time);
  const isUpcoming = contest.status === 'upcoming';
  const isOngoing = contest.status === 'ongoing';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{contest.title}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${isOngoing
                  ? 'bg-green-500/20 text-green-400'
                  : isUpcoming
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-500/20 text-gray-400'
                  }`}
              >
                {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
              </span>
            </div>
            {isCreator && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{contest.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {startDate.toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {contest.duration} mins
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              0 Registered
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[140px]">
          {isOngoing ? (
            <Link
              to={`/contests/${contest.slug}`}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-center font-semibold rounded-lg transition-colors"
            >
              Enter Contest
            </Link>
          ) : isUpcoming ? (
            <button
              onClick={onRegister}
              disabled={isRegistered}
              className={`w-full px-4 py-2 text-center font-semibold rounded-lg transition-colors ${isRegistered
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {isRegistered ? 'Registered' : 'Register Now'}
            </button>
          ) : (
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 text-center font-semibold rounded-lg cursor-not-allowed"
            >
              Ended
            </button>
          )}

          <Link
            to={`/contests/${contest.slug}`}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-center font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
