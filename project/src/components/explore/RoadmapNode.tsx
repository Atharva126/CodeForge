import { CheckCircle, Lock } from 'lucide-react';
import { RoadmapNode as IRoadmapNode } from '../../types/explore';

interface RoadmapNodeProps {
    node: IRoadmapNode;
    isUnlocked: boolean;
    onSelect: (node: IRoadmapNode) => void;
    isLast?: boolean;
}

export default function RoadmapNode({ node, isUnlocked, onSelect, isLast }: RoadmapNodeProps) {


    const status = !isUnlocked ? 'locked' : node.status || 'not_started';

    return (
        <div className="relative flex gap-6 group">
            {!isLast && (
                <div className={`absolute left-[1.15rem] top-10 bottom-[-2.5rem] w-0.5 ${status === 'completed' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
            )}

            <div className="flex-shrink-0 mt-1">
                {status === 'completed' ? (
                    <CheckCircle className="w-10 h-10 text-green-500 bg-white dark:bg-gray-900 rounded-full" />
                ) : status === 'locked' ? (
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                        <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${status === 'in_progress' ? 'border-blue-500 text-blue-500' : 'border-gray-300 dark:border-gray-600 text-gray-400'
                        } bg-white dark:bg-gray-900`}>
                        {node.order_index + 1}
                    </div>
                )}
            </div>

            <div
                onClick={() => isUnlocked && onSelect(node)}
                className={`flex-1 p-4 rounded-xl border transition-all duration-200 mb-8 ${isUnlocked
                    ? 'cursor-pointer hover:shadow-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    : 'opacity-70 bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 cursor-not-allowed'
                    }`}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className={`font-bold text-lg mb-1 ${isUnlocked ? 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400' : 'text-gray-500 dark:text-gray-500'
                            }`}>
                            {node.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {node.description}
                        </p>
                    </div>
                    {status === 'in_progress' && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                            In Progress
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
