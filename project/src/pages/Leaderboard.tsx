import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Trophy, Medal, Crown, Star, Users, TrendingUp, Award, Search, Filter, Flame, ChevronDown, Target, Sword, Shield, Zap, Eye, User, CheckCircle2 } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { supabase } from '../lib/supabase';

interface LeaderboardUser {
  id: string;
  username: string;
  rating: number;
  global_rank: number;
  problems_solved: number;
  acceptance_rate: number;
  forge_coins: number;
  streak: number;
  avatar_url?: string;
  country?: string;
  created_at: string;
  updated_at: string;
  tier: string;
  rating_change: number;
  rank_change: number;
  is_official?: boolean;
  is_pro?: boolean;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const usersPerPage = 50;

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (user && leaderboard.length > 0) {
      loadUserRank();
    }
  }, [user, leaderboard]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('rating', { ascending: false })
        .limit(100);

      if (error) throw error;

      const profiles = data || [];

      // Calculate ranks and tiers
      const processedData: LeaderboardUser[] = profiles.map((profile: any, index: number) => ({
        id: profile.id,
        username: profile.username || 'Anonymous',
        rating: profile.rating || 1200,
        global_rank: index + 1,
        problems_solved: profile.problems_solved || 0,
        acceptance_rate: profile.acceptance_rate || 0,
        forge_coins: profile.forge_coins || 0,
        streak: profile.streak || 0,
        avatar_url: profile.avatar_url,
        country: profile.location || 'Unknown',
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        tier: getTier(profile.rating || 1200, index + 1, profiles.length),
        rating_change: 0,
        rank_change: 0,
        is_official: !!profile.is_official,
        is_pro: !!profile.is_pro
      }));

      setLeaderboard(processedData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRank = async () => {
    if (!user) return;
    try {
      const userInList = leaderboard.find(u => u.id === user.id);
      if (userInList) {
        setUserRank(userInList);
      } else {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          const rating = profile.rating || 1200;
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('rating', rating);
          const rank = (count || 0) + 1;

          setUserRank({
            id: profile.id,
            username: profile.username || 'Anonymous',
            rating: rating,
            global_rank: rank,
            problems_solved: profile.problems_solved || 0,
            acceptance_rate: profile.acceptance_rate || 0,
            forge_coins: profile.forge_coins || 0,
            streak: profile.streak || 0,
            avatar_url: profile.avatar_url,
            country: profile.location || 'Unknown',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            tier: getTier(rating, rank, 1000),
            rating_change: 0,
            rank_change: 0,
            is_official: !!profile.is_official,
            is_pro: !!profile.is_pro
          });
        }
      }
    } catch (error) {
      console.error("Error loading user rank:", error);
    }
  };

  const filterLeaderboard = () => {
    let filtered = leaderboard;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.country && user.country.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter(user => user.tier === selectedTier);
    }

    return filtered;
  };

  const getTier = (_rating: number, rank?: number, totalUsers?: number) => {
    if (!rank || !totalUsers) return 'Rookie';

    const percentile = ((totalUsers - rank) / totalUsers) * 100;

    if (rank === 1) return 'Immortal';
    if (rank === 2) return 'Immortal';
    if (rank === 3) return 'Immortal';

    if (percentile >= 99) return 'Immortal';
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

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Immortal': return <Crown className="w-4 h-4" />;
      case 'Sovereign': return <Trophy className="w-4 h-4" />;
      case 'Apex': return <Target className="w-4 h-4" />;
      case 'Supreme': return <Star className="w-4 h-4" />;
      case 'Overlord': return <Award className="w-4 h-4" />;
      case 'Warlord': return <Sword className="w-4 h-4" />;
      case 'Titan': return <Shield className="w-4 h-4" />;
      case 'Alpha': return <Zap className="w-4 h-4" />;
      case 'Predator': return <Eye className="w-4 h-4" />;
      case 'Hunter': return <Search className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const TierBadge = ({ tier, size = 'sm' }: { tier: string, size?: 'sm' | 'lg' }) => {
    const colorClass = getTierColor(tier);
    const icon = getTierIcon(tier);

    return (
      <div className={`relative flex items-center justify-center ${size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'} rounded-lg border backdrop-blur-md transition-all duration-500 hover:scale-110 ${colorClass}`}>
        <div className="relative z-10">
          {icon}
        </div>
      </div>
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Immortal': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'Sovereign': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'Apex': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'Supreme': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'Overlord': return 'text-pink-400 bg-pink-500/20 border-pink-500/30';
      case 'Warlord': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'Titan': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'Alpha': return 'text-purple-500 bg-purple-500/20 border-purple-500/30';
      case 'Predator': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'Hunter': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    if (rank <= 10) return <Star className="w-5 h-5 text-purple-400" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };

  const getCountryCode = (country: string) => {
    const countryCodes: { [key: string]: string } = {
      'United States': 'US', 'China': 'CN', 'India': 'IN', 'Japan': 'JP', 'Germany': 'DE', 'United Kingdom': 'GB', 'France': 'FR', 'Brazil': 'BR', 'Italy': 'IT', 'Canada': 'CA', 'South Korea': 'KR', 'Spain': 'ES', 'Australia': 'AU', 'Russia': 'RU', 'Mexico': 'MX', 'Indonesia': 'ID', 'Netherlands': 'NL', 'Saudi Arabia': 'SA', 'Turkey': 'TR', 'Switzerland': 'CH', 'Taiwan': 'TW', 'Belgium': 'BE', 'Ireland': 'IE', 'Israel': 'IL', 'Norway': 'NO', 'Singapore': 'SG', 'Hong Kong': 'HK', 'Austria': 'AT', 'United Arab Emirates': 'AE', 'Nigeria': 'NG', 'South Africa': 'ZA', 'Egypt': 'EG', 'Malaysia': 'MY', 'Chile': 'CL', 'Finland': 'FI', 'Poland': 'PL', 'Thailand': 'TH', 'Philippines': 'PH', 'Colombia': 'CO', 'Pakistan': 'PK', 'Romania': 'RO', 'Czech Republic': 'CZ', 'New Zealand': 'NZ', 'Vietnam': 'VN', 'Bangladesh': 'BD', 'Denmark': 'DK', 'Peru': 'PE', 'Argentina': 'AR', 'Ukraine': 'UA',
    };
    return countryCodes[country] || 'XX';
  };

  const filteredLeaderboard = filterLeaderboard();
  const totalPages = Math.ceil(filteredLeaderboard.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredLeaderboard.slice(startIndex, endIndex);
  const topThree = leaderboard.slice(0, 3);

  const tiers = ['all', 'Rookie', 'Hunter', 'Predator', 'Alpha', 'Titan', 'Warlord', 'Overlord', 'Supreme', 'Apex', 'Sovereign', 'Immortal'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f13] flex items-center justify-center transition-colors duration-300">
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f13] text-gray-900 dark:text-white font-sans selection:bg-indigo-500/30 transition-colors duration-300">

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
              Global Rankings
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Compete with the top developers worldwide.
            <br className="hidden md:block" />
            Rise through the ranks and earn your place in history.
          </p>
        </div>

        {/* Top 3 Podium */}
        {!loading && topThree.length > 0 && !searchTerm && (
          <div className="mb-20 pt-10">
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-12 px-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="order-2 md:order-1 flex-1 max-w-sm w-full">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-white dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-2xl text-center transform hover:-translate-y-2 transition-transform duration-300">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-50 dark:border-[#0f0f13] shadow-lg">
                          <span className="text-xl font-bold text-gray-400">2</span>
                        </div>
                      </div>
                      <Link to={`/profile/${topThree[1].username}`} className="block">
                        <div className="mt-8 mb-4 relative inline-block cursor-pointer">
                          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-gray-300 to-gray-400">
                            <img
                              src={topThree[1].avatar_url || `https://ui-avatars.com/api/?name=${topThree[1].username}&background=random`}
                              alt={topThree[1].username}
                              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-[#0f0f13]"
                            />
                          </div>
                          {topThree[1].is_pro && (
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 p-1.5 rounded-full shadow-lg border-2 border-white dark:border-[#0f0f13]">
                              <Crown className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{topThree[1].username}</h3>
                      </Link>
                      <div className="flex justify-center items-center gap-2 mb-4">
                        {topThree[1].is_official && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            VERIFIED
                          </span>
                        )}
                        {topThree[1].is_pro && !topThree[1].is_official && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                        {(topThree[1].rating || 0).toLocaleString()}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="order-1 md:order-2 flex-1 max-w-sm w-full z-10">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                    <div className="relative bg-gradient-to-b from-yellow-500/10 to-transparent dark:bg-gray-900/60 backdrop-blur-xl border border-yellow-500/30 p-8 rounded-2xl text-center transform hover:-translate-y-2 transition-transform duration-300">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center border-4 border-gray-50 dark:border-[#0f0f13] shadow-lg shadow-yellow-500/50">
                          <Crown className="w-8 h-8 text-white animate-pulse" />
                        </div>
                      </div>
                      <Link to={`/profile/${topThree[0].username}`} className="block">
                        <div className="mt-10 mb-6 relative inline-block cursor-pointer">
                          <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600">
                            <img
                              src={topThree[0].avatar_url || `https://ui-avatars.com/api/?name=${topThree[0].username}&background=random`}
                              alt={topThree[0].username}
                              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-[#0f0f13]"
                            />
                          </div>
                          {topThree[0].is_pro && (
                            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 p-2 rounded-full shadow-lg border-2 border-white dark:border-[#0f0f13]">
                              <Crown className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{topThree[0].username}</h3>
                      </Link>
                      <div className="flex justify-center items-center gap-2 mb-4">
                        {topThree[0].is_official && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            VERIFIED
                          </span>
                        )}
                        {topThree[0].is_pro && !topThree[0].is_official && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
                        {(topThree[0].rating || 0).toLocaleString()}
                        <span className="text-lg font-normal text-yellow-600/70 dark:text-yellow-400/70 ml-2">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="order-3 flex-1 max-w-sm w-full">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-orange-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-white dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-2xl text-center transform hover:-translate-y-2 transition-transform duration-300">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-50 dark:border-[#0f0f13] shadow-lg">
                          <span className="text-xl font-bold text-orange-700 dark:text-orange-500">3</span>
                        </div>
                      </div>
                      <Link to={`/profile/${topThree[2].username}`} className="block">
                        <div className="mt-8 mb-4 relative inline-block cursor-pointer">
                          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-orange-300 to-orange-400">
                            <img
                              src={topThree[2].avatar_url || `https://ui-avatars.com/api/?name=${topThree[2].username}&background=random`}
                              alt={topThree[2].username}
                              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-[#0f0f13]"
                            />
                          </div>
                          {topThree[2].is_pro && (
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 p-1.5 rounded-full shadow-lg border-2 border-white dark:border-[#0f0f13]">
                              <Crown className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{topThree[2].username}</h3>
                      </Link>
                      <div className="flex justify-center items-center gap-2 mb-4">
                        {topThree[2].is_official && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            VERIFIED
                          </span>
                        )}
                        {topThree[2].is_pro && !topThree[2].is_official && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                        {(topThree[2].rating || 0).toLocaleString()}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search competitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1a1a1f]/50 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2f]/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all duration-300 shadow-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#1a1a1f]/50 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2f]/50 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1f]/70 transition-all duration-300 shadow-sm"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transform transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 bg-white dark:bg-[#1a1a1f]/30 backdrop-blur-md border border-gray-200 dark:border-[#2a2a2f]/30 rounded-2xl mb-6 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTier('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedTier === 'all'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-100 dark:bg-[#2a2a2f]/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2f]/70'
                    }`}
                >
                  All Tiers
                </button>
                {tiers.filter(t => t !== 'all').map(tier => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedTier === tier
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-100 dark:bg-[#2a2a2f]/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2f]/70'
                      }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {userRank && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-orange-600/20 dark:to-orange-500/10 backdrop-blur-md border border-blue-200 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-blue-500/5 dark:shadow-orange-500/10 overflow-hidden relative group">
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-500/10 dark:bg-orange-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 dark:group-hover:bg-orange-500/20 transition-all duration-700"></div>

            <div className="flex items-center justify-between relative z-10">
              <Link to={`/profile/${userRank.username}`} className="flex items-center gap-6 group/profile hover:opacity-80 transition-opacity">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-orange-500 dark:to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover/profile:rotate-12 transition-all duration-500 overflow-hidden border-2 border-white/20 dark:border-orange-400/20">
                    {userRank.avatar_url ? (
                      <img src={userRank.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Trophy className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div className="absolute -top-3 -right-3">
                    <TierBadge tier={userRank.tier} size="lg" />
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900 dark:text-white mb-1 tracking-tighter italic">#{userRank.global_rank}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest group-hover/profile:text-blue-600 dark:group-hover/profile:text-orange-400 transition-colors">Your Standing</h3>
                  <p className="text-blue-600 dark:text-orange-400 text-sm font-medium">
                    Better than {100 - Math.floor((userRank.global_rank / Math.max(1, leaderboard.length)) * 100)}% of coders
                  </p>
                </div>
              </Link>
              <div className="flex flex-col items-end gap-2 text-right">
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Current League</div>
                <div className={`px-6 py-2.5 rounded-xl text-lg font-black tracking-tighter uppercase shadow-xl ${getTierColor(userRank.tier)}`}>
                  {userRank.tier}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-[#1a1a1f]/30 backdrop-blur-md border border-gray-200 dark:border-[#2a2a2f]/30 rounded-2xl shadow-sm dark:shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2f]/50 bg-gray-50/50 dark:bg-transparent">
                  <th className="px-6 py-6 text-left text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Rank</th>
                  <th className="px-6 py-6 text-left text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Competitor</th>
                  <th className="px-6 py-6 text-left text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Tier</th>
                  <th className="px-6 py-6 text-left text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Rating</th>
                  <th className="px-6 py-6 text-left text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Solved</th>
                  <th className="px-6 py-6 text-left text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Acceptance</th>
                  <th className="px-6 py-6 text-left text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Streak</th>
                  <th className="px-6 py-6 text-left text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Growth</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user_row) => (
                  <tr
                    key={user_row.id}
                    className={`border-b border-gray-100 dark:border-[#2a2a2f]/20 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/[0.02] ${user_row.id === user?.id ? 'bg-blue-50 dark:bg-orange-500/[0.05] border-blue-100 dark:border-orange-500/20' : ''
                      }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl font-black transition-all duration-300 italic tracking-tighter ${user_row.global_rank === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 dark:from-yellow-300 dark:via-white dark:to-yellow-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]' :
                            user_row.global_rank === 2 ? 'text-gray-400 dark:text-gray-300' :
                              user_row.global_rank === 3 ? 'text-orange-600 dark:text-orange-500' :
                                user_row.global_rank <= 10 ? 'text-purple-600 dark:text-purple-400' :
                                  'text-gray-400 dark:text-gray-600'
                          }`}>
                          {user_row.global_rank <= 3 ? (
                            <div className="flex items-center gap-1">
                              {getRankIcon(user_row.global_rank)}
                              <span>{user_row.global_rank}</span>
                            </div>
                          ) : (
                            `#${user_row.global_rank}`
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Link to={`/profile/${user_row.username}`} className="block group/link">
                        <div className="flex items-center gap-4">
                          <div className="relative group">
                            <div className="w-14 h-14 bg-gray-100 dark:bg-gradient-to-br dark:from-[#2a2a2f] dark:to-[#1a1a1f] rounded-2xl flex items-center justify-center border border-gray-200 dark:border-[#2a2a2f]/50 relative transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm dark:shadow-lg group-hover/link:border-blue-500 dark:group-hover/link:border-blue-400">
                              {user_row.avatar_url ? (
                                <img src={user_row.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                              ) : (
                                <Users className="w-7 h-7 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                              )}
                            </div>
                            {/* Floating Tier Icon Above Avatar */}
                            <div className="absolute -top-3 -right-3 z-20">
                              <TierBadge tier={user_row.tier} />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 tracking-tight group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors">
                              {user_row.username}
                              {user_row.is_official ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              ) : user_row.is_pro ? (
                                <Zap className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                              ) : null}
                              {user_row.id === user?.id && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-orange-500 dark:text-white px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">You</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5 font-bold uppercase tracking-widest mt-0.5">
                              <ReactCountryFlag
                                countryCode={getCountryCode(user_row.country || 'Unknown')}
                                svg
                                style={{ width: '14px', height: '10px' }}
                              />
                              <span>{user_row.country || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 border ${getTierColor(user_row.tier)}`}>
                          {user_row.tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{user_row.rating}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-gray-600 dark:text-gray-300 font-bold text-lg">{user_row.problems_solved}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="text-gray-600 dark:text-gray-300 font-bold">{user_row.acceptance_rate}%</div>
                        <div className="w-16 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${user_row.acceptance_rate}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 group">
                        <Flame className="w-5 h-5 text-orange-500 transition-transform group-hover:scale-125 animate-pulse" />
                        <span className="text-gray-600 dark:text-gray-300 font-bold text-lg">{user_row.streak}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-black">
                        <TrendingUp className={`w-5 h-5 ${user_row.rating_change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`${user_row.rating_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {user_row.rating_change >= 0 ? '+' : ''}{user_row.rating_change}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between bg-white dark:bg-[#1a1a1f]/30 p-4 rounded-2xl border border-gray-200 dark:border-[#2a2a2f]/30 shadow-sm">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            Displaying <span className="text-gray-900 dark:text-gray-300">{startIndex + 1}-{Math.min(endIndex, filteredLeaderboard.length)}</span> of <span className="text-gray-900 dark:text-gray-300">{filteredLeaderboard.length}</span> legends
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-6 py-2 bg-gray-50 dark:bg-[#1a1a1f]/50 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a2f]/50 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 text-xs font-bold uppercase tracking-widest"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-2 bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 text-xs font-bold uppercase tracking-widest"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
