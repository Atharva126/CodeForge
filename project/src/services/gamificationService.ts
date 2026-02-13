import { supabase } from '../lib/supabase';

export interface UserPoints {
  id: string;
  user_id: string;
  points: number;
  level: number;
  experience: number;
  streak_days: number;
  last_active_date: string;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  transaction_type: 'earned' | 'spent' | 'bonus' | 'penalty';
  source: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  points_reward: number;
  requirement_type: string;
  requirement_value: number;
  is_hidden: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface Leaderboard {
  id: string;
  name: string;
  description?: string;
  type: string;
  period: string;
  is_active: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  score: number;
  rank?: number;
  last_updated: string;
  user?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly';
  target_type: string;
  target_value: number;
  coin_reward: number;
  xp_reward: number;
  is_active: boolean;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_value: number;
  is_completed: boolean;
  completed_at?: string;
  period_start: string;
  period_end: string;
  challenge?: Challenge;
}

export const gamificationService = {
  // Get user points and level
  async getUserPoints(userId: string): Promise<UserPoints | null> {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user points:', error);
      return null;
    }

    return data;
  },

  // Award points to user
  async awardPoints(
    userId: string,
    points: number,
    source: string,
    description?: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('award_points', {
        user_uuid: userId,
        points_amount: points,
        transaction_source: source,
        transaction_description: description,
        metadata: metadata
      });

      if (error) {
        console.error('Error awarding points:', error);
        return false;
      }

      // Check for new achievements
      await this.checkAchievements(userId);

      return true;
    } catch (error) {
      console.error('Error awarding points:', error);
      return false;
    }
  },

  // Get user's point transactions
  async getUserTransactions(userId: string, limit: number = 50): Promise<PointTransaction[]> {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  },

  // Update login streak
  async updateLoginStreak(userId: string): Promise<boolean> {
    try {
      const { data: currentPoints } = await supabase
        .from('user_points')
        .select('streak_days, last_active_date')
        .eq('user_id', userId)
        .single();

      if (!currentPoints) return false;

      const today = new Date().toISOString().split('T')[0];
      const lastActive = currentPoints.last_active_date;
      const todayDate = new Date(today);

      let newStreak = currentPoints.streak_days;
      let streakBonus = 0;

      // Check if last active was yesterday
      const yesterday = new Date(todayDate);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActive === yesterday.toISOString().split('T')[0]) {
        // Continue streak
        newStreak += 1;
        streakBonus = 5; // 5 points for maintaining streak
      } else if (lastActive !== today) {
        // Reset streak
        newStreak = 1;
      }

      // Award daily login coin (1 Forge Coin)
      await this.claimDailyReward(userId, 'login');

      // Update streak and last active date
      const { error } = await supabase
        .from('user_points')
        .update({
          streak_days: newStreak,
          last_active_date: today
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating streak:', error);
        return false;
      }

      // Award streak bonus points
      if (streakBonus > 0) {
        await this.awardPoints(
          userId,
          streakBonus,
          'login_streak',
          `Daily login bonus (${newStreak} day streak)`,
          { streak_days: newStreak }
        );
      }

      return true;
    } catch (error) {
      console.error('Error updating login streak:', error);
      return false;
    }
  },

  // Get all achievements
  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }

    return data || [];
  },

  // Get user's achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }

    return data || [];
  },

  // Check and award new achievements
  async checkAchievements(userId: string): Promise<Achievement[]> {
    try {
      // Get user stats
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!userPoints) return [];

      // Get user's existing achievements
      const { data: existingAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      const existingIds = existingAchievements?.map(a => a.achievement_id) || [];

      // Get all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*');

      if (!allAchievements) return [];

      const newAchievements: Achievement[] = [];

      for (const achievement of allAchievements) {
        if (existingIds.includes(achievement.id)) continue;

        let earned = false;

        switch (achievement.requirement_type) {
          case 'points':
            earned = userPoints.points >= achievement.requirement_value;
            break;
          case 'level':
            earned = userPoints.level >= achievement.requirement_value;
            break;
          case 'streak_days':
            earned = userPoints.streak_days >= achievement.requirement_value;
            break;
          // Add more achievement types as needed
        }

        if (earned) {
          // Award achievement
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id
            });

          if (!error) {
            newAchievements.push(achievement);

            // Award achievement bonus points
            if (achievement.points_reward > 0) {
              await this.awardPoints(
                userId,
                achievement.points_reward,
                'achievement',
                `Achievement: ${achievement.name}`,
                { achievement_id: achievement.id }
              );
            }
          }
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  },

  // Get leaderboards
  async getLeaderboards(): Promise<Leaderboard[]> {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching leaderboards:', error);
      return [];
    }

    return data || [];
  },

  // Get leaderboard entries
  async getLeaderboardEntries(leaderboardId: string, limit: number = 100): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        user:profiles(username, full_name, avatar_url)
      `)
      .eq('leaderboard_id', leaderboardId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard entries:', error);
      return [];
    }

    return data || [];
  },

  // Update leaderboard (call this when user earns points)
  async updateLeaderboard(userId: string, score: number, type: string): Promise<void> {
    try {
      // Get relevant leaderboards
      const { data: leaderboards } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('type', type)
        .eq('is_active', true);

      if (!leaderboards) return;

      for (const leaderboard of leaderboards) {
        // Upsert leaderboard entry
        const { error } = await supabase
          .from('leaderboard_entries')
          .upsert({
            leaderboard_id: leaderboard.id,
            user_id: userId,
            score: score,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'leaderboard_id,user_id'
          });

        if (error) {
          console.error('Error updating leaderboard:', error);
        }
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  },

  async getUserRank(userId: string, leaderboardId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('rank')
      .eq('leaderboard_id', leaderboardId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }

    return data?.rank || null;
  },

  // Daily Rewards
  async claimDailyReward(userId: string, type: 'login' | 'submission'): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('handle_daily_reward', {
        p_user_id: userId,
        p_reward_type: type
      });

      if (error) {
        console.error(`Error claiming daily ${type} reward:`, error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error(`Critical error claiming daily ${type} reward:`, error);
      return 0;
    }
  },

  async syncUserChallenges(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('sync_user_challenges', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error syncing user challenges:', error);
      }
    } catch (error) {
      console.error('Critical error syncing user challenges:', error);
    }
  },

  // Challenges
  async getUserChallenges(userId: string): Promise<UserChallenge[]> {
    // First, sync to ensure they exist for the current period
    await this.syncUserChallenges(userId);

    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user challenges:', error);
      return [];
    }

    return data || [];
  },

  async updateChallengeProgress(userId: string, targetType: string, increment: number = 1): Promise<void> {
    try {
      console.log(`[Gamification] Updating progress for user ${userId}, type: ${targetType} by ${increment}`);

      // Call the server-side RPC function which handles everything atomically
      const { error } = await supabase.rpc('update_challenge_progress', {
        p_user_id: userId,
        p_target_type: targetType,
        p_increment: increment
      });

      if (error) {
        console.error('Error updating challenge progress via RPC:', error);
        return;
      }

      console.log('[Gamification] Challenge progress updated successfully');
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  }
};
