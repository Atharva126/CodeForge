import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Clock, Zap, Database, Trophy, Info } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface SubmissionAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  runtime: number;
  memory: number;
  runtimePercentile: number;
  memoryPercentile: number;
  avgRuntime: number;
  fastestRuntime: number;
  avgMemory: number;
  lowestMemory: number;
  complexityInfo?: {
    time: string;
    space: string;
  };
}

const SubmissionAnalyticsModal: React.FC<SubmissionAnalyticsModalProps> = ({
  isOpen,
  onClose,
  runtime,
  memory,
  runtimePercentile,
  memoryPercentile,
  avgRuntime,
  fastestRuntime,
  avgMemory,
  lowestMemory,
  complexityInfo,
}) => {
  if (!isOpen) return null;

  // Generate realistic bell-curve distribution data for charts
  const generateDistribution = (mean: number, stdDev: number, userVal: number) => {
    // Ensure the chart range covers both the average and the user's performance
    const minVal = Math.min(mean - 2.5 * stdDev, userVal - stdDev);
    const maxVal = Math.max(mean + 2.5 * stdDev, userVal + stdDev);
    const range = maxVal - minVal;

    return Array.from({ length: 40 }, (_, i) => {
      const x = Math.round(minVal + (i * range) / 40);
      // Bell curve formula: y = e^(-(x-mean)^2 / (2*stdDev^2))
      const y = Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2))) * 100;
      return { x, y: Math.max(5, Math.round(y)) };
    });
  };

  const runtimeData = useMemo(() => generateDistribution(avgRuntime, 25, runtime), [avgRuntime, runtime]);
  const memoryData = useMemo(() => generateDistribution(avgMemory, 5, memory), [avgMemory, memory]);

  const MetricCard: React.FC<{
    label: string;
    value: string;
    subValue?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    color: 'blue' | 'green' | 'purple' | 'yellow';
  }> = ({ label, value, subValue, icon, trend, color }) => {
    const colors = {
      blue: 'border-blue-500/30 shadow-blue-500/10 from-blue-500/10',
      green: 'border-green-500/30 shadow-green-500/10 from-green-500/10',
      purple: 'border-purple-500/30 shadow-purple-500/10 from-purple-500/10',
      yellow: 'border-yellow-500/30 shadow-yellow-500/10 from-yellow-500/10',
    };

    return (
      <div className={`relative p-4 rounded-2xl bg-gray-900/60 backdrop-blur-xl border ${colors[color]} bg-gradient-to-br to-transparent transition-all duration-300 hover:scale-[1.02]`}>
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-xl bg-gray-800/80 mb-3 text-gray-200">
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-500/10 text-green-400' :
              trend === 'down' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'
              }`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trend === 'up' ? 'Better' : trend === 'down' ? 'Worse' : 'Average'}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          {subValue && <p className="text-xs text-blue-400 mt-1">{subValue}</p>}
        </div>
      </div>
    );
  };

  const ChartSection: React.FC<{
    title: string;
    data: any[];
    userValue: number;
    percentile: number;
    color: string;
    unit: string;
  }> = ({ title, data, userValue, percentile, color, unit }) => (
    <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/50 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Zap className="w-16 h-16 text-white" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">Beats {percentile}% of users</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white tracking-tighter">{userValue} <span className="text-sm text-gray-500 font-normal">{unit}</span></p>
        </div>
      </div>

      <div className="h-48 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
            <XAxis dataKey="x" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: any) => [`${value}% Users`, 'Frequency']}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke={color}
              fillOpacity={1}
              fill={`url(#grad-${color})`}
              strokeWidth={3}
              animationDuration={1500}
            />
            <ReferenceLine x={userValue} stroke="#fff" strokeDasharray="3 3" label={{ position: 'top', value: 'You', fill: '#fff', fontSize: 10 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with sophisticated gradient */}
      <div
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden bg-gray-950 border border-gray-800 rounded-3xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] flex flex-col animate-in fade-in zoom-in-95 duration-300">

        {/* Glowing header accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-purple-500 to-green-500" />

        {/* Header Section */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-2xl">
              <Trophy className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Submission Analysis</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-sm text-gray-400">Memory and Runtime metrics validated</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition-all text-gray-400 hover:text-white group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Status"
              value="Accepted"
              subValue="All test cases passed"
              icon={<Zap className="w-5 h-5 text-green-400" />}
              color="green"
            />
            <MetricCard
              label="Runtime"
              value={`${runtime} ms`}
              subValue={`Best: ${fastestRuntime} ms`}
              icon={<Clock className="w-5 h-5 text-blue-400" />}
              trend={runtime <= avgRuntime ? 'up' : 'down'}
              color="blue"
            />
            <MetricCard
              label="Memory"
              value={`${memory.toFixed(1)} MB`}
              subValue={`Best: ${lowestMemory.toFixed(1)} MB`}
              icon={<Database className="w-5 h-5 text-purple-400" />}
              trend={memory <= avgMemory ? 'up' : 'down'}
              color="purple"
            />
            <MetricCard
              label="Efficiency"
              value={`Top ${100 - runtimePercentile}%`}
              subValue="Ranked by Runtime"
              icon={<Trophy className="w-5 h-5 text-yellow-500" />}
              color="yellow"
            />
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSection
              title="Runtime Distribution"
              data={runtimeData}
              userValue={runtime}
              percentile={runtimePercentile}
              color="#3b82f6"
              unit="ms"
            />
            <ChartSection
              title="Memory Distribution"
              data={memoryData}
              userValue={memory}
              percentile={memoryPercentile}
              color="#a855f7"
              unit="MB"
            />
          </div>

          {/* Complexity & Recommendations Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 rounded-2xl bg-gray-800/20 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Complexity Insights</h3>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Time Complexity</p>
                  <p className="text-2xl font-mono text-blue-400 font-bold">{complexityInfo?.time || 'O(N)'}</p>
                  <p className="text-sm text-gray-400 mt-2">Optimal for the given constraints. Efficiency is within the expected bounds.</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Space Complexity</p>
                  <p className="text-2xl font-mono text-purple-400 font-bold">{complexityInfo?.space || 'O(N)'}</p>
                  <p className="text-sm text-gray-400 mt-2">Memory footprint is consistent with competitive standard solutions.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-white mb-3">AI Recommendations</h4>
              <ul className="space-y-3">
                <li className="flex gap-2 text-xs text-gray-400">
                  <span className="text-blue-500 mt-1">●</span>
                  Your solution could benefit from a few-pass approach.
                </li>
                <li className="flex gap-2 text-xs text-gray-400">
                  <span className="text-blue-500 mt-1">●</span>
                  Consider using bit manipulation for O(1) space optimization.
                </li>
              </ul>
              <button className="mt-4 py-2 px-4 rounded-xl bg-gray-900 border border-gray-700 hover:border-blue-500 text-xs text-gray-200 transition-all font-medium">
                Deep Code Analysis →
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-gray-900/60 border-t border-gray-800 flex justify-between items-center mt-auto">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/32?img=${i + 10}`} alt="user" />
              </div>
            ))}
            <div className="px-3 h-8 rounded-full border-2 border-gray-900 bg-gray-800 text-[10px] flex items-center justify-center font-bold text-gray-400">
              +1.2k others solved this
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            Acknowledge Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionAnalyticsModal;

