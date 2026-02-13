import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BadgeService, { UserBadge } from '../services/badgeService';
import { BadgeGrid, BadgeStats, BadgeDetailModal } from '../components/BadgeComponents';
import { Trophy, Filter, Search, Star, TrendingUp } from 'lucide-react';
import { Badge } from '../types/badges';

export default function Badges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<UserBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Badge['category'] | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<Badge['rarity'] | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const badgeService = BadgeService;

  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  useEffect(() => {
    filterBadges();
  }, [badges, searchTerm, selectedCategory, selectedRarity]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      // Retroactive sync on load to catch missed unlocks
      if (user?.id) {
        await badgeService.syncAndCheck(user.id, 'all');
      }
      const userBadges = await badgeService.getUserBadges(user?.id || '');
      setBadges(userBadges);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBadges = () => {
    let filtered = badges;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(badge =>
        badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(badge => badge.category === selectedCategory);
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(badge => badge.rarity === selectedRarity);
    }

    setFilteredBadges(filtered);
  };

  const handleBadgeClick = (badge: UserBadge) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBadge(null);
  };

  const categories: (Badge['category'] | 'all')[] = ['all', 'problems', 'rating', 'streak', 'contest', 'special'];
  const rarities: (Badge['rarity'] | 'all')[] = ['all', 'common', 'rare', 'epic', 'legendary'];

  const unlockedBadges = badges.filter(b => b.unlocked);
  const lockedBadges = badges.filter(b => !b.unlocked);
  const totalPoints = unlockedBadges.reduce((sum, b) => sum + b.points, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-gray-500 dark:text-gray-400">Loading badges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
            Badge Collection
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your achievements and show off your coding prowess
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <BadgeStats badges={badges} />
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-800/50 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search badges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Rarity Filter */}
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gray-400" />
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value as Badge['rarity'] | 'all')}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
              >
                {rarities.map(rarity => (
                  <option key={rarity} value={rarity}>
                    {rarity === 'all' ? 'All Rarities' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-xl transition-all ${viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                  }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl transition-all ${viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                  }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800">
            <span>Showing {filteredBadges.length} of {badges.length} badges</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
            <span>{unlockedBadges.length} unlocked</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
            <span className="text-yellow-600 dark:text-yellow-500">{totalPoints} total points</span>
          </div>
        </div>

        {/* Unlocked Badges Section */}
        {unlockedBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Unlocked Badges ({unlockedBadges.length})
            </h2>
            <BadgeGrid
              badges={unlockedBadges.filter(badge => {
                const matchesSearch = !searchTerm ||
                  badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  badge.description.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
                const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;
                return matchesSearch && matchesCategory && matchesRarity;
              })}
              showProgress={false}
              size="large"
              onBadgeClick={handleBadgeClick}
            />
          </div>
        )}

        {/* Locked Badges Section */}
        {lockedBadges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              Locked Badges ({lockedBadges.length})
            </h2>
            <BadgeGrid
              badges={lockedBadges.filter(badge => {
                const matchesSearch = !searchTerm ||
                  badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  badge.description.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
                const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;
                return matchesSearch && matchesCategory && matchesRarity;
              })}
              showProgress={true}
              size="medium"
              onBadgeClick={handleBadgeClick}
            />
          </div>
        )}

        {/* Empty State */}
        {filteredBadges.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800">
            <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No badges found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedRarity('all');
              }}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            isOpen={isModalOpen}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  );
}
