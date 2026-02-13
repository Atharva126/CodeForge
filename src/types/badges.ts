export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'problems' | 'rating' | 'streak' | 'contest' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: 'problems_solved' | 'rating' | 'streak' | 'contest_rank' | 'daily_streak' | 'perfect_submission' | 'speed_demon' | 'consistency_king';
    value: number;
    description: string;
  };
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
  unlocked: boolean;
  unlockedAt?: string;
  points: number;
}

export const BADGES: Badge[] = [
  // Problem Solving Badges
  {
    id: 'first_problem',
    name: 'First Steps',
    description: 'Solve your first problem',
    icon: '🎯',
    category: 'problems',
    rarity: 'common',
    requirement: {
      type: 'problems_solved',
      value: 1,
      description: 'Solve 1 problem'
    },
    unlocked: false,
    points: 10
  },
  {
    id: 'problem_novice',
    name: 'Problem Novice',
    description: 'Solve 10 problems',
    icon: '🌟',
    category: 'problems',
    rarity: 'common',
    requirement: {
      type: 'problems_solved',
      value: 10,
      description: 'Solve 10 problems'
    },
    unlocked: false,
    points: 25
  },
  {
    id: 'problem_slayer',
    name: 'Problem Slayer',
    description: 'Solve 50 problems',
    icon: '⚔️',
    category: 'problems',
    rarity: 'rare',
    requirement: {
      type: 'problems_solved',
      value: 50,
      description: 'Solve 50 problems'
    },
    unlocked: false,
    points: 100
  },
  {
    id: 'problem_master',
    name: 'Problem Master',
    description: 'Solve 100 problems',
    icon: '👑',
    category: 'problems',
    rarity: 'epic',
    requirement: {
      type: 'problems_solved',
      value: 100,
      description: 'Solve 100 problems'
    },
    unlocked: false,
    points: 250
  },
  {
    id: 'problem_legend',
    name: 'Problem Legend',
    description: 'Solve 500 problems',
    icon: '🏆',
    category: 'problems',
    rarity: 'legendary',
    requirement: {
      type: 'problems_solved',
      value: 500,
      description: 'Solve 500 problems'
    },
    unlocked: false,
    points: 1000
  },

  // Rating Badges
  {
    id: 'rating_1200',
    name: 'Code Specialist',
    description: 'Reach 1200 rating',
    icon: '🥉',
    category: 'rating',
    rarity: 'common',
    requirement: {
      type: 'rating',
      value: 1200,
      description: 'Reach 1200 rating'
    },
    unlocked: false,
    points: 50
  },
  {
    id: 'rating_1600',
    name: 'Code Expert',
    description: 'Reach 1600 rating',
    icon: '🥈',
    category: 'rating',
    rarity: 'rare',
    requirement: {
      type: 'rating',
      value: 1600,
      description: 'Reach 1600 rating'
    },
    unlocked: false,
    points: 150
  },
  {
    id: 'rating_2000',
    name: 'Code Master',
    description: 'Reach 2000 rating',
    icon: '🥇',
    category: 'rating',
    rarity: 'epic',
    requirement: {
      type: 'rating',
      value: 2000,
      description: 'Reach 2000 rating'
    },
    unlocked: false,
    points: 300
  },
  {
    id: 'rating_2400',
    name: 'Grandmaster',
    description: 'Reach 2400 rating',
    icon: '🏅',
    category: 'rating',
    rarity: 'legendary',
    requirement: {
      type: 'rating',
      value: 2400,
      description: 'Reach 2400 rating'
    },
    unlocked: false,
    points: 750
  },

  // Streak Badges
  {
    id: 'streak_3',
    name: 'On Fire',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    requirement: {
      type: 'daily_streak',
      value: 3,
      description: 'Maintain a 3-day streak'
    },
    unlocked: false,
    points: 30
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '💥',
    category: 'streak',
    rarity: 'rare',
    requirement: {
      type: 'daily_streak',
      value: 7,
      description: 'Maintain a 7-day streak'
    },
    unlocked: false,
    points: 75
  },
  {
    id: 'streak_30',
    name: 'Monthly Champion',
    description: 'Maintain a 30-day streak',
    icon: '🌙',
    category: 'streak',
    rarity: 'epic',
    requirement: {
      type: 'daily_streak',
      value: 30,
      description: 'Maintain a 30-day streak'
    },
    unlocked: false,
    points: 200
  },
  {
    id: 'streak_100',
    name: 'Century Streak',
    description: 'Maintain a 100-day streak',
    icon: '⭐',
    category: 'streak',
    rarity: 'legendary',
    requirement: {
      type: 'daily_streak',
      value: 100,
      description: 'Maintain a 100-day streak'
    },
    unlocked: false,
    points: 500
  },

  // Contest Badges
  {
    id: 'contest_first',
    name: 'Contest Debut',
    description: 'Participate in your first contest',
    icon: '🎪',
    category: 'contest',
    rarity: 'common',
    requirement: {
      type: 'contest_rank',
      value: 1,
      description: 'Participate in 1 contest'
    },
    unlocked: false,
    points: 20
  },
  {
    id: 'contest_top_100',
    name: 'Top 100',
    description: 'Achieve top 100 in a contest',
    icon: '🎯',
    category: 'contest',
    rarity: 'rare',
    requirement: {
      type: 'contest_rank',
      value: 100,
      description: 'Achieve top 100 in a contest'
    },
    unlocked: false,
    points: 120
  },
  {
    id: 'contest_top_10',
    name: 'Elite Coder',
    description: 'Achieve top 10 in a contest',
    icon: '🚀',
    category: 'contest',
    rarity: 'epic',
    requirement: {
      type: 'contest_rank',
      value: 10,
      description: 'Achieve top 10 in a contest'
    },
    unlocked: false,
    points: 350
  },
  {
    id: 'contest_winner',
    name: 'Contest Champion',
    description: 'Win a contest',
    icon: '🏆',
    category: 'contest',
    rarity: 'legendary',
    requirement: {
      type: 'contest_rank',
      value: 1,
      description: 'Win a contest (rank #1)'
    },
    unlocked: false,
    points: 1000
  },

  // Special Achievement Badges
  {
    id: 'perfect_10',
    name: 'Perfect Ten',
    description: 'Solve 10 problems in a row without any wrong submissions',
    icon: '✨',
    category: 'special',
    rarity: 'rare',
    requirement: {
      type: 'perfect_submission',
      value: 10,
      description: 'Solve 10 problems in a row without wrong submissions'
    },
    unlocked: false,
    points: 80
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Solve a medium problem in under 5 minutes',
    icon: '⚡',
    category: 'special',
    rarity: 'epic',
    requirement: {
      type: 'speed_demon',
      value: 1,
      description: 'Solve a medium problem in under 5 minutes'
    },
    unlocked: false,
    points: 150
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Solve at least one problem every day for 30 days',
    icon: '👑',
    category: 'special',
    rarity: 'epic',
    requirement: {
      type: 'consistency_king',
      value: 30,
      description: 'Solve at least one problem every day for 30 days'
    },
    unlocked: false,
    points: 200
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Solve a problem before 6 AM for 7 consecutive days',
    icon: '🌅',
    category: 'special',
    rarity: 'rare',
    requirement: {
      type: 'daily_streak',
      value: 7,
      description: 'Solve a problem before 6 AM for 7 consecutive days'
    },
    unlocked: false,
    points: 90
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Solve a problem after 11 PM for 7 consecutive days',
    icon: '🦉',
    category: 'special',
    rarity: 'rare',
    requirement: {
      type: 'daily_streak',
      value: 7,
      description: 'Solve a problem after 11 PM for 7 consecutive days'
    },
    unlocked: false,
    points: 90
  },
  {
    id: 'polyglot',
    name: 'Polyglot Programmer',
    description: 'Solve problems using 5 different programming languages',
    icon: '🌍',
    category: 'special',
    rarity: 'epic',
    requirement: {
      type: 'perfect_submission',
      value: 5,
      description: 'Solve problems using 5 different programming languages'
    },
    unlocked: false,
    points: 180
  }
];

export const RARITY_COLORS = {
  common: {
    bg: 'from-gray-500/20 to-gray-600/20',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/20'
  },
  rare: {
    bg: 'from-blue-500/20 to-blue-600/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  epic: {
    bg: 'from-purple-500/20 to-purple-600/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20'
  },
  legendary: {
    bg: 'from-orange-500/20 to-orange-600/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20'
  }
};

export const CATEGORY_ICONS = {
  problems: '🎯',
  rating: '📈',
  streak: '🔥',
  contest: '🏆',
  special: '⭐'
};
