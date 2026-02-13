import { Badge, BADGES } from '../types/badges';
import { supabase } from '../lib/supabase';

export interface UserBadge extends Badge {
  unlocked: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
}

export interface BadgeProgress {
  problemsSolved: number;
  currentRating: number;
  currentStreak: number;
  contestsParticipated: number;
  bestContestRank: number;
  perfectSubmissions: number;
  speedDemonAchievements: number;
  consistencyDays: number;
  languagesUsed: string[];
}

class BadgeService {
  private static instance: BadgeService;

  static getInstance(): BadgeService {
    if (!BadgeService.instance) {
      BadgeService.instance = new BadgeService();
    }
    return BadgeService.instance;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[BadgeService] Profile fetch error:', profileError);
      }

      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

      if (badgesError) {
        console.error('[BadgeService] Badges fetch error:', badgesError);
      }

      const progress = this.extractProgressFromProfile(profile);
      const unlockedBadgeIds = userBadges?.map(ub => ub.badge_id) || [];

      return BADGES.map(badge => {
        const isUnlocked = unlockedBadgeIds.includes(badge.id);
        const badgeProgress = this.calculateBadgeProgress(badge, progress);

        return {
          ...badge,
          unlocked: isUnlocked,
          unlockedAt: userBadges?.find(ub => ub.badge_id === badge.id)?.unlocked_at,
          progress: badgeProgress
        };
      });
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return BADGES.map(badge => ({
        ...badge,
        unlocked: false,
        progress: this.calculateBadgeProgress(badge, this.getDefaultProgress())
      }));
    }
  }

  private extractProgressFromProfile(profile: any): BadgeProgress {
    return {
      problemsSolved: profile?.problems_solved || 0,
      currentRating: profile?.rating || 0,
      currentStreak: profile?.streak || 0,
      contestsParticipated: profile?.contests_participated || 0,
      bestContestRank: profile?.best_contest_rank || 999999,
      perfectSubmissions: profile?.perfect_submissions || 0,
      speedDemonAchievements: profile?.speed_demon_achievements || 0,
      consistencyDays: profile?.consistency_days || 0,
      languagesUsed: profile?.languages_used || []
    };
  }

  private getDefaultProgress(): BadgeProgress {
    return {
      problemsSolved: 0,
      currentRating: 0,
      currentStreak: 0,
      contestsParticipated: 0,
      bestContestRank: 999999,
      perfectSubmissions: 0,
      speedDemonAchievements: 0,
      consistencyDays: 0,
      languagesUsed: []
    };
  }

  private calculateBadgeProgress(badge: Badge, progress: BadgeProgress): UserBadge['progress'] {
    let current = 0;
    let required = badge.requirement.value;

    switch (badge.requirement.type) {
      case 'problems_solved':
        current = progress.problemsSolved;
        break;
      case 'rating':
        current = progress.currentRating;
        break;
      case 'daily_streak':
        current = progress.currentStreak;
        break;
      case 'contest_rank':
        if (badge.id === 'contest_first') {
          current = progress.contestsParticipated;
          required = 1;
        } else {
          // For rank badges, current is 1 if they achieved it, 0 otherwise
          current = progress.bestContestRank <= badge.requirement.value ? 1 : 0;
          required = 1;
        }
        break;
      case 'perfect_submission':
        current = progress.perfectSubmissions;
        break;
      case 'speed_demon':
        current = progress.speedDemonAchievements;
        break;
      case 'consistency_king':
        current = progress.consistencyDays;
        break;
      default:
        current = 0;
    }

    const percentage = Math.min(100, Math.round((current / required) * 100));

    return {
      current,
      required,
      percentage
    };
  }

  async syncAndCheck(userId: string, eventType: string, eventData?: any): Promise<Badge[]> {
    try {
      // 1. Fetch latest progress badges
      const userBadges = await this.getUserBadges(userId);
      const newlyUnlocked: Badge[] = [];

      // 2. Check each locked badge
      for (const badge of userBadges) {
        const isEligible = this.shouldUnlockBadge(badge, eventType, eventData);

        if (!badge.unlocked && isEligible) {
          const success = await this.unlockBadge(userId, badge.id);
          if (success) {
            newlyUnlocked.push(badge);

            // Add notification (Don't block the loop)
            // First check if a badge notification already exists to avoid spamming
            const { data: existingNotif } = await supabase
              .from('notifications')
              .select('id')
              .match({ user_id: userId, type: 'badge', title: 'Badge Unlocked!' })
              .ilike('message', `%${badge.name}%`)
              .maybeSingle();

            if (!existingNotif) {
              supabase.from('notifications').insert({
                user_id: userId,
                type: 'badge',
                title: 'Badge Unlocked!',
                message: `You've earned the ${badge.name} badge!`,
                link: '/badges'
              }).then(({ error }) => {
                if (error) console.warn(`[Sync] Notification failed for ${badge.id}:`, error.message);
              });
            }

            // Add activity (Don't block the loop)
            supabase.from('user_activity').insert({
              user_id: userId,
              action_type: 'unlocked_badge',
              title: `Unlocked ${badge.name} Badge`,
              description: badge.description,
              metadata: { badge_id: badge.id }
            }).then(({ error }) => {
              if (error) console.warn(`[Sync] Activity log failed for ${badge.id}:`, error.message);
            });
          } else {
            console.error(`[Sync] Failed to unlock badge ${badge.id} for user ${userId}`);
          }
        }
      }

      if (newlyUnlocked.length > 0) {
        console.log(`[BadgeService] Sync complete. Unlocked ${newlyUnlocked.length} badges.`);
      }

      return newlyUnlocked;
    } catch (error) {
      return [];
    }
  }

  async checkAndUnlockBadges(userId: string, eventType: string, data: any): Promise<Badge[]> {
    return this.syncAndCheck(userId, eventType, data);
  }

  private shouldUnlockBadge(badge: UserBadge, eventType: string, data: any): boolean {
    if (!badge.progress) return false;

    // If eventType is 'all', check if requirement is met regardless of event
    if (eventType === 'all' || eventType === 'sync') {
      const eligible = badge.progress.current >= badge.requirement.value;

      if (badge.requirement.type === 'contest_rank' && badge.id !== 'contest_first') {
        return badge.progress.current >= 1;
      }
      return eligible;
    }

    switch (badge.requirement.type) {
      case 'problems_solved':
        return eventType === 'problem_solved' && badge.progress.current >= badge.requirement.value;
      case 'rating':
        const rating = data?.newRating ?? badge.progress.current;
        return (eventType === 'rating_updated' || eventType === 'all') && rating >= badge.requirement.value;
      case 'daily_streak':
        return (eventType === 'streak_updated' || eventType === 'all') && badge.progress.current >= badge.requirement.value;
      case 'contest_rank':
        if (eventType === 'contest_participated' && badge.requirement.value === 1) {
          return true;
        }
        if (eventType === 'contest_completed' && data?.rank <= badge.requirement.value) {
          return true;
        }
        return false;
      case 'perfect_submission':
        return (eventType === 'perfect_streak' || eventType === 'all') && badge.progress.current >= badge.requirement.value;
      case 'speed_demon':
        return (eventType === 'speed_demon' || eventType === 'all') && badge.progress.current >= badge.requirement.value;
      case 'consistency_king':
        return (eventType === 'consistency_achievement' || eventType === 'all') && badge.progress.current >= badge.requirement.value;
      default:
        return false;
    }
  }

  private async unlockBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('unlock_user_badge', {
        p_user_id: userId,
        p_badge_id: badgeId
      });

      if (error) {
        console.error(`[BadgeService] RPC Error unlocking ${badgeId}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }

      if (data === true) {
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      console.error(`[BadgeService] Critical error in RPC unlock for ${badgeId}:`, error);
      return false;
    }
  }

  async updateBadgeProgress(userId: string, progress: Partial<BadgeProgress>): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({
          ...(progress.problemsSolved !== undefined && { problems_solved: progress.problemsSolved }),
          ...(progress.currentRating !== undefined && { rating: progress.currentRating }),
          ...(progress.currentStreak !== undefined && { streak: progress.currentStreak }),
          ...(progress.contestsParticipated !== undefined && { contests_participated: progress.contestsParticipated }),
          ...(progress.bestContestRank !== undefined && { best_contest_rank: progress.bestContestRank }),
          ...(progress.perfectSubmissions !== undefined && { perfect_submissions: progress.perfectSubmissions }),
          ...(progress.speedDemonAchievements !== undefined && { speed_demon_achievements: progress.speedDemonAchievements }),
          ...(progress.consistencyDays !== undefined && { consistency_days: progress.consistencyDays }),
          ...(progress.languagesUsed !== undefined && { languages_used: progress.languagesUsed })
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating badge progress:', error);
    }
  }

  getBadgesByCategory(badges: UserBadge[], category: Badge['category']): UserBadge[] {
    return badges.filter(badge => badge.category === category);
  }

  getBadgesByRarity(badges: UserBadge[], rarity: Badge['rarity']): UserBadge[] {
    return badges.filter(badge => badge.rarity === rarity);
  }

  getUnlockedBadges(badges: UserBadge[]): UserBadge[] {
    return badges.filter(badge => badge.unlocked);
  }

  getLockedBadges(badges: UserBadge[]): UserBadge[] {
    return badges.filter(badge => !badge.unlocked);
  }

  getBadgePoints(badges: UserBadge[]): number {
    return badges
      .filter(badge => badge.unlocked)
      .reduce((total, badge) => total + badge.points, 0);
  }

  getBadgeStats(badges: UserBadge[]) {
    const total = badges.length;
    const unlocked = badges.filter(badge => badge.unlocked).length;
    const points = this.getBadgePoints(badges);

    const rarityStats = {
      common: { total: 0, unlocked: 0 },
      rare: { total: 0, unlocked: 0 },
      epic: { total: 0, unlocked: 0 },
      legendary: { total: 0, unlocked: 0 }
    };

    badges.forEach(badge => {
      rarityStats[badge.rarity].total++;
      if (badge.unlocked) {
        rarityStats[badge.rarity].unlocked++;
      }
    });

    return {
      total,
      unlocked,
      locked: total - unlocked,
      points,
      completionPercentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      rarityStats
    };
  }
}

export default BadgeService.getInstance();
