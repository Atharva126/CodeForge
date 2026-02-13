interface ProgressTrackerProps {
    total: number;
    completed: number;
}

export default function ProgressTracker({ total, completed }: ProgressTrackerProps) {
    const percentage = Math.round((completed / total) * 100) || 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">Completed</span>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {completed}/{total} Modules
                </span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}
