import React from 'react';
import { UserBadge } from '../services/badgeService';
import { RARITY_COLORS } from '../types/badges';
import { Trophy, Lock, TrendingUp, Star } from 'lucide-react';

interface BadgeCardProps {
  badge: UserBadge;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ 
  badge, 
  showProgress = true, 
  size = 'medium',
  onClick 
}) => {
  const colors = RARITY_COLORS[badge.rarity];
  const isUnlocked = badge.unlocked;
  
  const sizeClasses = {
    small: 'w-16 h-16 p-2',
    medium: 'w-20 h-20 p-3',
    large: 'w-24 h-24 p-4'
  };

  const iconSizes = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  };

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer transition-all duration-300 hover:scale-105 ${
        isUnlocked ? 'hover:shadow-lg' : 'opacity-60'
      }`}
    >
      {/* Badge Card */}
      <div
        className={`
          ${sizeClasses[size]}
          rounded-2xl border backdrop-blur-xl transition-all duration-300
          ${isUnlocked 
            ? `bg-gradient-to-br ${colors.bg} ${colors.border} hover:${colors.glow}` 
            : 'bg-gray-800/50 border-gray-700/50'
          }
        `}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Badge Icon */}
          <div className={`${iconSizes[size]} ${isUnlocked ? '' : 'grayscale'}`}>
            {isUnlocked ? badge.icon : '🔒'}
          </div>
          
          {/* Lock overlay for locked badges */}
          {!isUnlocked && (
            <div className="absolute inset-0 bg-gray-900/50 rounded-2xl flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
          )}
          
          {/* Shine effect for unlocked badges */}
          {isUnlocked && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>

      {/* Badge Name */}
      <div className="mt-2 text-center">
        <h3 className={`text-xs font-medium ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
          {badge.name}
        </h3>
        {size !== 'small' && (
          <p className={`text-xs ${isUnlocked ? colors.text : 'text-gray-600'} mt-1`}>
            {badge.points} pts
          </p>
        )}
      </div>

      {/* Progress indicator for locked badges */}
      {!isUnlocked && showProgress && badge.progress && size !== 'small' && (
        <div className="mt-2">
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${badge.progress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {badge.progress.current}/{badge.progress.required}
          </p>
        </div>
      )}
    </div>
  );
};

interface BadgeGridProps {
  badges: UserBadge[];
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  maxVisible?: number;
  onBadgeClick?: (badge: UserBadge) => void;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ 
  badges, 
  showProgress = true, 
  size = 'medium',
  maxVisible,
  onBadgeClick 
}) => {
  const displayBadges = maxVisible ? badges.slice(0, maxVisible) : badges;
  const hasMore = maxVisible && badges.length > maxVisible;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
      {displayBadges.map((badge) => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          showProgress={showProgress}
          size={size}
          onClick={() => onBadgeClick?.(badge)}
        />
      ))}
      
      {hasMore && (
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center">
            <span className="text-gray-500 text-sm font-medium">+{badges.length - maxVisible}</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface BadgeDetailModalProps {
  badge: UserBadge;
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({ 
  badge, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  const colors = RARITY_COLORS[badge.rarity];
  const isUnlocked = badge.unlocked;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Badge Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Badge Display */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={`
              w-32 h-32 rounded-2xl border backdrop-blur-xl flex items-center justify-center mb-4
              ${isUnlocked 
                ? `bg-gradient-to-br ${colors.bg} ${colors.border}` 
                : 'bg-gray-800/50 border-gray-700/50'
              }
            `}
          >
            <div className="text-6xl">
              {isUnlocked ? badge.icon : '🔒'}
            </div>
          </div>
          
          <h3 className={`text-xl font-bold mb-2 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
            {badge.name}
          </h3>
          
          <p className={`text-center mb-4 ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
            {badge.description}
          </p>

          <div className="flex items-center gap-4 text-sm">
            <span className={`px-3 py-1 rounded-full font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
              {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
            </span>
            <span className="text-orange-400 font-medium">
              {badge.points} points
            </span>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
          <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Requirement
          </h4>
          <p className="text-gray-300">{badge.requirement.description}</p>
        </div>

        {/* Progress */}
        {!isUnlocked && badge.progress && (
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Progress
              </h4>
              <span className="text-sm text-gray-400">
                {badge.progress.current}/{badge.progress.required}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${badge.progress.percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2 text-center">
              {badge.progress.percentage}% complete
            </p>
          </div>
        )}

        {/* Unlocked Date */}
        {isUnlocked && badge.unlockedAt && (
          <div className="bg-gray-800/50 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Unlocked
            </h4>
            <p className="text-gray-300">
              {new Date(badge.unlockedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface BadgeStatsProps {
  badges: UserBadge[];
}

export const BadgeStats: React.FC<BadgeStatsProps> = ({ badges }) => {
  const stats = {
    total: badges.length,
    unlocked: badges.filter(b => b.unlocked).length,
    points: badges.filter(b => b.unlocked).reduce((sum, b) => sum + b.points, 0),
    common: { unlocked: badges.filter(b => b.unlocked && b.rarity === 'common').length },
    rare: { unlocked: badges.filter(b => b.unlocked && b.rarity === 'rare').length },
    epic: { unlocked: badges.filter(b => b.unlocked && b.rarity === 'epic').length },
    legendary: { unlocked: badges.filter(b => b.unlocked && b.rarity === 'legendary').length }
  };

  const completionPercentage = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
        <div className="text-2xl font-bold text-white mb-1">{stats.unlocked}</div>
        <div className="text-sm text-gray-400">Unlocked</div>
        <div className="text-xs text-gray-500 mt-1">{completionPercentage}%</div>
      </div>
      
      <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
        <div className="text-2xl font-bold text-orange-400 mb-1">{stats.points}</div>
        <div className="text-sm text-gray-400">Total Points</div>
      </div>
      
      <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
        <div className="text-2xl font-bold text-blue-400 mb-1">{stats.rare.unlocked}</div>
        <div className="text-sm text-gray-400">Rare Badges</div>
      </div>
      
      <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
        <div className="text-2xl font-bold text-purple-400 mb-1">{stats.epic.unlocked + stats.legendary.unlocked}</div>
        <div className="text-sm text-gray-400">Epic+</div>
      </div>
    </div>
  );
};
