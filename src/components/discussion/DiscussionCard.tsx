import { Link } from 'react-router-dom';
import { MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Discussion } from '../../types/discussion';
import VoteControl from './VoteControl';

interface DiscussionCardProps {
    discussion: Discussion;
    userVote?: 1 | -1 | null;
    onVote?: (discussionId: string, voteType: 1 | -1) => void;
}

export default function DiscussionCard({ discussion, userVote, onVote }: DiscussionCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
                <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg h-fit">
                    <VoteControl
                        upvotes={discussion.upvotes}
                        downvotes={discussion.downvotes}
                        userVote={userVote}
                        onVote={(type) => onVote?.(discussion.id, type)}
                        orientation="vertical"
                    />
                </div>
                <div className="flex-1">
                    <Link to={`/discuss/${discussion.id}`} className="block group">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {discussion.title}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-900 dark:text-gray-200">
                                {discussion.profiles?.username || 'Anonymous'}
                            </span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex flex-wrap gap-2">
                            {discussion.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-sm ml-auto">
                            <MessageSquare className="w-4 h-4" />
                            <span>0 comments</span> {/* TODO: Add comment count */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
