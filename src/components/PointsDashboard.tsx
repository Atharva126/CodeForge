import { useState, useEffect } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import { gamificationService } from '../services/gamificationService';
import { Trophy, Star, Flame, TrendingUp, Award, Target } from 'lucide-react';

export default function PointsDashboard() {
  const { userPoints, achievements, loading } = useGamification();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!userPoints) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No points data available</p>
        </div>
      </div>
    );
  }

  const progressToNextLevel = userPoints.experience % 100;
  const nextLevelPoints = 100 - progressToNextLevel;

  return (
    <div className="space-y-6">
      {/* Main Points Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8" />
            <h3 className="text-2xl font-bold">Points & Level</h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{userPoints.points.toLocaleString()}</div>
            <div className="text-sm opacity-90">Total Points</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5" />
              <span className="font-semibold">Level {userPoints.level}</span>
            </div>
            <div className="text-sm opacity-90">
              {nextLevelPoints} points to Level {userPoints.level + 1}
            </div>
            <div className="mt-2 bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${progressToNextLevel}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5" />
              <span className="font-semibold">Streak</span>
            </div>
            <div className="text-2xl font-bold">{userPoints.streak_days}</div>
            <div className="text-sm opacity-90">Day streak</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">Experience</span>
            </div>
            <div className="text-2xl font-bold">{userPoints.experience}</div>
            <div className="text-sm opacity-90">Total XP</div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Achievements</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.slice(0, 6).map((achievement) => (
              <div key={achievement.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{achievement.icon || '🏆'}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{achievement.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                    {achievement.points_reward > 0 && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        +{achievement.points_reward} points
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points Activity */}
      <PointsActivity />
    </div>
  );
}

function PointsActivity() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userPoints } = useGamification();

  useEffect(() => {
    const loadTransactions = async () => {
      if (!userPoints) return;

      try {
        const data = await gamificationService.getUserTransactions(userPoints.user_id, 10);
        setTransactions(data);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [userPoints]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-6 h-6 text-blue-500" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${transaction.transaction_type === 'earned' ? 'bg-green-500' :
                  transaction.transaction_type === 'spent' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}></div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {transaction.description || transaction.source}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className={`font-semibold ${transaction.transaction_type === 'earned' ? 'text-green-600 dark:text-green-400' :
                transaction.transaction_type === 'spent' ? 'text-red-600 dark:text-red-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                {transaction.transaction_type === 'earned' ? '+' : ''}
                {transaction.points} points
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
