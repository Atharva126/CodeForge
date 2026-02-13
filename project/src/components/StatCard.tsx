import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | null;
  trendValue?: string;
  className?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, trendValue, className = '' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-orange-500/20">
          <Icon className="w-6 h-6 text-orange-400" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            <span>{trend === 'up' ? '↑' : '↓'}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-gray-300 font-medium">{title}</p>
        <motion.p
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-3xl font-bold text-white"
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}
