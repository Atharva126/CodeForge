import { formatDistanceToNow } from 'date-fns';
import { Reply, CheckCircle2, Zap } from 'lucide-react';
import { Comment } from '../../types/discussion';
import VoteControl from './VoteControl';
import MarkdownRenderer from './MarkdownRenderer';

interface CommentItemProps {
    comment: Comment;
    userVote?: 1 | -1 | null;
    onVote?: (commentId: string, voteType: 1 | -1) => void;
    onReply: (parentId: string) => void;
}

export default function CommentItem({ comment, userVote, onVote, onReply }: CommentItemProps) {
    // const [isReplying, setIsReplying] = useState(false);

    return (
        <div className="flex gap-3">
            <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                    {comment.profiles?.avatar_url ? (
                        <img src={comment.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        comment.profiles?.username?.[0]?.toUpperCase() || 'A'
                    )}
                </div>
            </div>
            <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {comment.profiles?.username || 'Anonymous'}
                            </span>
                            {comment.profiles?.is_official ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                            ) : comment.profiles?.is_pro ? (
                                <Zap className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                            ) : null}
                        </div>
                        <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    <div className="text-gray-800 dark:text-gray-200 text-sm">
                        <MarkdownRenderer content={comment.content} />
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-1 ml-2">
                    <VoteControl
                        upvotes={comment.upvotes}
                        downvotes={comment.downvotes}
                        userVote={userVote}
                        onVote={(type) => onVote?.(comment.id, type)}
                        orientation="horizontal"
                    />
                    <button
                        onClick={() => onReply(comment.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                        <Reply className="w-3 h-3" />
                        Reply
                    </button>
                </div>

                {/* Recursive rendering for replies would go here, maybe passed as children or handled by parent */}
            </div>
        </div>
    );
}
