import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Roadmap, RoadmapNode as IRoadmapNode, UserProgress } from '../types/explore';
import RoadmapNode from '../components/explore/RoadmapNode';
import ProgressTracker from '../components/explore/ProgressTracker';
import MarkdownRenderer from '../components/discussion/MarkdownRenderer';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, Play, CheckCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RoadmapDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [nodes, setNodes] = useState<IRoadmapNode[]>([]);
    const [progress, setProgress] = useState<UserProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<IRoadmapNode | null>(null);

    useEffect(() => {
        if (slug) fetchRoadmapData();
    }, [slug]);

    const fetchRoadmapData = async () => {
        // Fetch Roadmap
        const { data: roadmapData, error: roadmapError } = await supabase
            .from('roadmaps')
            .select('*')
            .eq('slug', slug)
            .single();

        if (roadmapError || !roadmapData) {
            console.error('Error fetching roadmap:', roadmapError);
            setLoading(false);
            return;
        }
        setRoadmap(roadmapData);

        // Fetch Nodes
        const { data: nodesData, error: nodesError } = await supabase
            .from('roadmap_nodes')
            .select('*')
            .eq('roadmap_id', roadmapData.id)
            .order('order_index', { ascending: true });

        if (nodesError) console.error('Error fetching nodes:', nodesError);
        else setNodes(nodesData || []);

        // Fetch User Progress
        if (user) {
            const { data: progressData, error: progressError } = await supabase
                .from('user_roadmap_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('roadmap_id', roadmapData.id);

            if (progressError) console.error('Error fetching progress:', progressError);
            else setProgress(progressData || []);
        }

        setLoading(false);
    };

    const handleNodeSelect = (node: IRoadmapNode) => {
        setSelectedNode(node);
    };

    const isNodeUnlocked = (node: IRoadmapNode) => {
        if (node.order_index === 0) return true;
        const parent = nodes.find(n => n.id === node.parent_node_id);
        if (!parent) return nodes[node.order_index - 1] ? isNodeCompleted(nodes[node.order_index - 1]) : true;
        return isNodeCompleted(parent);
    };

    const isNodeCompleted = (node: IRoadmapNode) => {
        return progress.some(p => p.node_id === node.id && p.status === 'completed');
    };

    const markAsComplete = async () => {
        if (!user || !roadmap || !selectedNode) return;

        const { error } = await supabase.from('user_roadmap_progress').upsert([
            {
                user_id: user.id,
                roadmap_id: roadmap.id,
                node_id: selectedNode.id,
                status: 'completed',
                completed_at: new Date().toISOString(),
            }
        ], { onConflict: 'user_id,node_id' });

        if (!error) {
            fetchRoadmapData(); // Refresh progress
            setSelectedNode(null); // Close detail view or update state
        }
    };

    if (loading) return <div className="pt-24 text-center">Loading...</div>;
    if (!roadmap) return <div className="pt-24 text-center">Roadmap not found</div>;

    const completedCount = progress.filter(p => p.status === 'completed').length;

    return (
        <div className="pt-20 pb-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link to="/explore" className="flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Explore
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{roadmap.title}</h1>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">{roadmap.description}</p>
                        </div>
                        <div className="w-64 hidden lg:block">
                            <ProgressTracker total={nodes.length} completed={completedCount} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-0 relative">
                        <div className="absolute left-[3.25rem] top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
                        {nodes.map((node, index) => {
                            const unlocked = isNodeUnlocked(node);
                            const completed = isNodeCompleted(node);
                            return (
                                <RoadmapNode
                                    key={node.id}
                                    node={{ ...node, status: completed ? 'completed' : unlocked ? 'in_progress' : 'not_started' }}
                                    isUnlocked={unlocked}
                                    onSelect={handleNodeSelect}
                                    isLast={index === nodes.length - 1}
                                />
                            );
                        })}
                    </div>

                    <div className="hidden lg:block">
                        {/* Sidebar area or sticky progress */}
                        <div className="sticky top-24">
                            {selectedNode ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{selectedNode.title}</h3>
                                    <div className="prose dark:prose-invert max-w-none text-sm mb-6">
                                        <MarkdownRenderer content={selectedNode.content || 'No content provided.'} />
                                    </div>

                                    {selectedNode.problem_ids && selectedNode.problem_ids.length > 0 && (
                                        <div className="mb-6 space-y-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Linked Problems</h4>
                                            <div className="space-y-2">
                                                {selectedNode.problem_ids.map((slug) => (
                                                    <Link
                                                        key={slug}
                                                        to={`/problem/${slug}`}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-500/50 hover:bg-white dark:hover:bg-gray-800 transition-all group/prob"
                                                    >
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover/prob:text-blue-600 dark:group-hover/prob:text-blue-400">
                                                            {slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                        </span>
                                                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover/prob:text-blue-500 group-hover/prob:translate-x-0.5 group-hover/prob:-translate-y-0.5 transition-all" />
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={markAsComplete}
                                        disabled={isNodeCompleted(selectedNode)}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-green-600 disabled:cursor-default transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        {isNodeCompleted(selectedNode) ? (
                                            <span className="flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Completed</span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2"><Play className="w-4 h-4" /> Mark Complete</span>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 text-center text-gray-500">
                                    Select a topic to view details
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Modal for Node Details */}
            {selectedNode && (
                <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{selectedNode.title}</h3>
                        <div className="prose dark:prose-invert max-w-none text-sm mb-6">
                            <MarkdownRenderer content={selectedNode.content || 'No content provided.'} />
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="flex-1 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg"
                            >
                                Close
                            </button>
                            <button
                                onClick={markAsComplete}
                                disabled={isNodeCompleted(selectedNode)}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-green-600"
                            >
                                {isNodeCompleted(selectedNode) ? 'Completed' : 'Mark Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
