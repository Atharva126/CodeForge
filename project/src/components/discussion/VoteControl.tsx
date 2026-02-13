import { ArrowBigUp, ArrowBigDown } from 'lucide-react';

interface VoteControlProps {
    upvotes: number;
    downvotes: number;
    userVote?: 1 | -1 | null;
    onVote: (voteType: 1 | -1) => void;
    orientation?: 'vertical' | 'horizontal';
}

export default function VoteControl({
    upvotes,
    downvotes,
    userVote,
    onVote,
    orientation = 'horizontal',
}: VoteControlProps) {
    return (
        <div className={`flex items-center ${orientation === 'vertical' ? 'flex-col space-y-1' : 'space-x-2'}`}>
            <button
                onClick={() => onVote(1)}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${userVote === 1 ? 'text-orange-500' : 'text-gray-500'
                    }`}
            >
                <ArrowBigUp className={`w-6 h-6 ${userVote === 1 ? 'fill-current' : ''}`} />
            </button>
            <span className="font-bold text-gray-700 dark:text-gray-300">
                {upvotes - downvotes}
            </span>
            <button
                onClick={() => onVote(-1)}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${userVote === -1 ? 'text-blue-500' : 'text-gray-500'
                    }`}
            >
                <ArrowBigDown className={`w-6 h-6 ${userVote === -1 ? 'fill-current' : ''}`} />
            </button>
        </div>
    );
}
