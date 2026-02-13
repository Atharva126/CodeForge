import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { gamificationService, UserPoints, Achievement, LeaderboardEntry } from '../services/gamificationService';

interface GamificationContextType {
  userPoints: UserPoints | null;
  achievements: Achievement[];
  leaderboards: LeaderboardEntry[];
  loading: boolean;
  refreshPoints: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
  refreshLeaderboards: () => Promise<void>;
  updateLoginStreak: () => Promise<boolean>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPoints = async () => {
    if (!user) return;
    
    try {
      const points = await gamificationService.getUserPoints(user.id);
      setUserPoints(points);
    } catch (error) {
      console.error('Error refreshing points:', error);
    }
  };

  const refreshAchievements = async () => {
    if (!user) return;
    
    try {
      const userAchievements = await gamificationService.getUserAchievements(user.id);
      setAchievements(userAchievements.map(ua => ua.achievement!).filter(Boolean));
    } catch (error) {
      console.error('Error refreshing achievements:', error);
    }
  };

  const refreshLeaderboards = async () => {
    try {
      const leaderboards = await gamificationService.getLeaderboards();
      const entries = await Promise.all(
        leaderboards.map(async (leaderboard) => {
          const leaderboardEntries = await gamificationService.getLeaderboardEntries(leaderboard.id, 10);
          return leaderboardEntries;
        })
      );
      setLeaderboards(entries.flat());
    } catch (error) {
      console.error('Error refreshing leaderboards:', error);
    }
  };

  const updateLoginStreak = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await gamificationService.updateLoginStreak(user.id);
      if (success) {
        await refreshPoints();
      }
      return success;
    } catch (error) {
      console.error('Error updating login streak:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!user) {
      setUserPoints(null);
      setAchievements([]);
      setLeaderboards([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        refreshPoints(),
        refreshAchievements(),
        refreshLeaderboards()
      ]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return (
    <GamificationContext.Provider value={{
      userPoints,
      achievements,
      leaderboards,
      loading,
      refreshPoints,
      refreshAchievements,
      refreshLeaderboards,
      updateLoginStreak
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
