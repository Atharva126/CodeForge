import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Award } from 'lucide-react';

interface Insight {
  icon: React.ReactNode;
  text: string;
  type: 'performance' | 'suggestion' | 'achievement' | 'warning';
}

interface InsightsBoxProps {
  insights: Insight[];
  className?: string;
}

export default function InsightsBox({ insights, className = '' }: InsightsBoxProps) {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'performance':
        return 'border-l-green-400 bg-green-500/10';
      case 'suggestion':
        return 'border-l-blue-400 bg-blue-500/10';
      case 'achievement':
        return 'border-l-purple-400 bg-purple-500/10';
      case 'warning':
        return 'border-l-orange-400 bg-orange-500/10';
      default:
        return 'border-l-gray-400 bg-gray-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-lg ${className}`}
    >
      <h3 className="text-lg font-semibold text-white mb-4">Personalized Insights</h3>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${getTypeStyles(insight.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {insight.icon}
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">
              {insight.text}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Helper function to generate sample insights
export const generateSampleInsights = (): Insight[] => [
  {
    icon: <TrendingUp className="w-4 h-4 text-green-400" />,
    text: "You solve Medium problems 30% faster than last month. Keep up the great work!",
    type: 'performance'
  },
  {
    icon: <Target className="w-4 h-4 text-blue-400" />,
    text: "Try more Graph problems to improve your rating. You're 120 points away from Expert tier.",
    type: 'suggestion'
  },
  {
    icon: <Clock className="w-4 h-4 text-orange-400" />,
    text: "Your average solve time has improved by 15% this week. Focus on consistency!",
    type: 'warning'
  },
  {
    icon: <Award className="w-4 h-4 text-purple-400" />,
    text: "Congratulations! You've earned the 'Speed Demon' badge for solving 10 problems in under 30 minutes.",
    type: 'achievement'
  }
];
