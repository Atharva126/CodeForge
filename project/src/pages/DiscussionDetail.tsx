import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Discussion, Comment } from '../types/discussion';
import MarkdownRenderer from '../components/discussion/MarkdownRenderer';
import CommentItem from '../components/discussion/CommentItem';
import VoteControl from '../components/discussion/VoteControl';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Calendar, User, CheckCircle2, Zap, ChevronLeft, X, CornerDownRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DiscussionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [userVote, setUserVote] = useState<1 | -1 | null>(null);
    const [commentVotes, setCommentVotes] = useState<Record<string, 1 | -1>>({});
    const commentFormRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        fetchDiscussion();
        fetchComments();
    }, [id]);

    useEffect(() => {
        if (user && id) {
            fetchUserVote();
            fetchCommentVotes();
        }
    }, [user, id]);

    const fetchDiscussion = async () => {
        if (!id) return;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            setError('Invalid discussion ID format');
            setLoading(false);
            return;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('discussions')
                .select('*, profiles:author_id(username, avatar_url, is_official, is_pro)')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error('Error fetching discussion:', fetchError);
                setError(fetchError.message);
            } else {
                setDiscussion(data);
            }
        } catch (err: any) {
            console.error('Unexpected error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserVote = async () => {
        if (!id || !user) return;
        const { data, error } = await supabase
            .from('discussion_votes')
            .select('vote_type')
            .eq('user_id', user.id)
            .eq('discussion_id', id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No result"
            console.error('Error fetching user vote:', error);
        } else if (data) {
            setUserVote(data.vote_type as 1 | -1);
        }
    };

    const fetchCommentVotes = async () => {
        if (!id || !user) return;

        // We need to fetch votes for all comments in this discussion
        // A more efficient way would be to fetch only for displayed comments, 
        // but for now we fetch all votes by this user for comments in this discussion.
        // Since we can't easily join on the client side without the comment IDs, 
        // we'll fetch votes where comment_id is in the fetched comments list.
        // This requires comments to be fetched first.
    };

    // Better strategy: Fetch comments, then fetch votes for those comments
    useEffect(() => {
        if (user && comments.length > 0) {
            const fetchVotes = async () => {
                const { data: votes } = await supabase
                    .from('comment_votes')
                    .select('comment_id, vote_type')
                    .eq('user_id', user.id)
                    .in('comment_id', comments.map(c => c.id));

                if (votes) {
                    const voteMap: Record<string, 1 | -1> = {};
                    votes.forEach((v: any) => {
                        voteMap[v.comment_id] = v.vote_type;
                    });
                    setCommentVotes(voteMap);
                }
            };
            fetchVotes();
        }
    }, [user, comments]);

    const fetchComments = async () => {
        if (!id) return;
        const { data, error } = await supabase
            .from('discussion_comments')
            .select('*, profiles:author_id(username, avatar_url, is_official, is_pro)')
            .eq('discussion_id', id)
            .order('created_at', { ascending: true });

        if (error) console.error('Error fetching comments:', error);
        else setComments(data || []);
    };

    const handleVote = async (type: 1 | -1) => {
        if (!user || !id || !discussion) return; // TODO: Show login prompt

        const currentVote = userVote;
        const isRemovingVote = currentVote === type;

        // Optimistic update
        setUserVote(isRemovingVote ? null : type);

        // Update discussion counts locally
        setDiscussion(prev => {
            if (!prev) return null;
            let newUpvotes = prev.upvotes;
            let newDownvotes = prev.downvotes;

            if (currentVote === 1) newUpvotes--;
            if (currentVote === -1) newDownvotes--;

            if (!isRemovingVote) {
                if (type === 1) newUpvotes++;
                if (type === -1) newDownvotes++;
            }

            return { ...prev, upvotes: newUpvotes, downvotes: newDownvotes };
        });

        try {
            if (isRemovingVote) {
                await supabase
                    .from('discussion_votes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('discussion_id', id);
            } else {
                await supabase
                    .from('discussion_votes')
                    .upsert({
                        user_id: user.id,
                        discussion_id: id,
                        vote_type: type
                    });
            }
        } catch (err) {
            console.error('Error voting:', err);
            // Revert changes on error
            fetchDiscussion();
            fetchUserVote();
        }
    };

    const handleCommentVote = async (commentId: string, type: 1 | -1) => {
        if (!user) return;

        const currentVote = commentVotes[commentId];
        const isRemovingVote = currentVote === type;

        // Optimistic update
        const newVotes = { ...commentVotes };
        if (isRemovingVote) {
            delete newVotes[commentId];
        } else {
            newVotes[commentId] = type;
        }
        setCommentVotes(newVotes);

        setComments(prev => prev.map(c => {
            if (c.id !== commentId) return c;

            let newUpvotes = c.upvotes;
            let newDownvotes = c.downvotes;

            if (currentVote === 1) newUpvotes--;
            if (currentVote === -1) newDownvotes--;

            if (!isRemovingVote) {
                if (type === 1) newUpvotes++;
                if (type === -1) newDownvotes++;
            }

            return { ...c, upvotes: newUpvotes, downvotes: newDownvotes };
        }));

        try {
            if (isRemovingVote) {
                await supabase
                    .from('comment_votes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('comment_id', commentId);
            } else {
                await supabase
                    .from('comment_votes')
                    .upsert({
                        user_id: user.id,
                        comment_id: commentId,
                        vote_type: type
                    });
            }
        } catch (err) {
            console.error('Error voting on comment:', err);
            // Revert (reload comments)
            fetchComments();
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !user || !newComment.trim()) return;

        const { error } = await supabase.from('discussion_comments').insert([
            {
                discussion_id: id,
                author_id: user.id,
                content: newComment,
                parent_id: replyingTo,
            },
        ]);

        if (error) {
            console.error('Error posting comment:', error);
        } else {
            setNewComment('');
            setReplyingTo(null);
            fetchComments();
        }
    };

    const handleReply = (commentId: string) => {
        setReplyingTo(commentId);
        commentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus textarea if possible
        const textarea = commentFormRef.current?.querySelector('textarea');
        if (textarea) (textarea as HTMLTextAreaElement).focus();
    };

    if (loading) return <div className="pt-24 text-center">Loading...</div>;
    if (error) return (
        <div className="pt-24 text-center">
            <h3 className="text-xl font-bold text-red-600">Error Loading Discussion</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
            <p className="text-sm text-gray-500 mt-4">ID: {id}</p>
        </div>
    );
    if (!discussion) return <div className="pt-24 text-center">Discussion not found</div>;

    // Organize comments into threads
    const rootComments = comments.filter((c) => !c.parent_id);
    const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

    return (
        <div className="pt-20 pb-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6 font-bold text-sm"
                >
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all shadow-sm">
                        <ChevronLeft className="w-4 h-4" />
                    </div>
                    Back to Discussions
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <VoteControl
                                    upvotes={discussion.upvotes}
                                    downvotes={discussion.downvotes}
                                    userVote={userVote}
                                    onVote={handleVote}
                                    orientation="vertical"
                                />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    {discussion.title}
                                </h1>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-4 h-4" />
                                            <span>{discussion.profiles?.username}</span>
                                        </div>
                                        {discussion.profiles?.is_official ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                                        ) : discussion.profiles?.is_pro ? (
                                            <Zap className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}</span>
                                    </div>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                                        {discussion.category}
                                    </span>
                                </div>
                                <div className="prose dark:prose-invert max-w-none">
                                    <MarkdownRenderer content={discussion.content} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Comments ({comments.length})
                        </h3>

                        {user ? (
                            <form ref={commentFormRef} onSubmit={handlePostComment} className="mb-8 scroll-mt-24">
                                {replyingTo && (
                                    <div className="flex items-center justify-between px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-t-lg text-blue-400 text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <CornerDownRight className="w-3 h-3" />
                                            <span>Replying to {comments.find(c => c.id === replyingTo)?.profiles?.username || 'comment'}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setReplyingTo(null)}
                                            className="p-1 hover:bg-blue-500/20 rounded-md transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={replyingTo ? "Write your reply..." : "Write a comment..."}
                                    className={`w-full p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 ${replyingTo ? 'rounded-b-lg border-t-0' : 'rounded-lg'}`}
                                    rows={4}
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
                                    >
                                        {replyingTo ? 'Post Reply' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-8">
                                Please login to comment
                            </div>
                        )}

                        <div className="space-y-6">
                            {rootComments.map((comment) => (
                                <div key={comment.id} className="space-y-4">
                                    <CommentItem
                                        comment={comment}
                                        userVote={commentVotes[comment.id]}
                                        onVote={handleCommentVote}
                                        onReply={handleReply}
                                    />
                                    {/* Simple one-level nesting for now, or recursive if Component supports it */}
                                    <div className="pl-12 space-y-4">
                                        {getReplies(comment.id).map((reply) => (
                                            <CommentItem
                                                key={reply.id}
                                                comment={reply}
                                                userVote={commentVotes[reply.id]}
                                                onVote={handleCommentVote}
                                                onReply={(id) => setReplyingTo(id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
