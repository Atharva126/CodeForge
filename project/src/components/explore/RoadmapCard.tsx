import { Link } from 'react-router-dom';
import { Clock, Book, ChevronRight } from 'lucide-react';
import { Roadmap } from '../../types/explore';

interface RoadmapCardProps {
    roadmap: Roadmap;
}

export default function RoadmapCard({ roadmap }: RoadmapCardProps) {
    const difficultyColor = {
        Beginner: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        Intermediate: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
        Advanced: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    };

    return (
        <Link
            to={`/explore/${roadmap.slug}`}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
        >
            {roadmap.thumbnail_url && (
                <div className="h-48 w-full overflow-hidden relative">
                    <img
                        src={roadmap.thumbnail_url}
                        alt={roadmap.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${difficultyColor[roadmap.difficulty]}`}
                        >
                            {roadmap.difficulty}
                        </span>
                    </div>
                </div>
            )}

            <div className="p-6 flex flex-col flex-1">
                {!roadmap.thumbnail_url && (
                    <div className="flex justify-between items-start mb-4">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColor[roadmap.difficulty]}`}
                        >
                            {roadmap.difficulty}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {roadmap.category}
                        </span>
                    </div>
                )}

                {roadmap.thumbnail_url && (
                    <div className="mb-3">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {roadmap.category}
                        </span>
                    </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {roadmap.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-2 flex-1">
                    {roadmap.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{roadmap.estimated_hours}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Book className="w-4 h-4" />
                            <span>Modules</span>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    );
}
