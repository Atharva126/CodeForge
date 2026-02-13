import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, List, Trash2, Edit3,
    Play,
    Bookmark, Share2, Globe, Lock,
    PlusCircle, BookOpen, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface ProblemList {
    id: string;
    name: string;
    description: string;
    created_at: string;
    item_count?: number;
}

interface ListItem {
    id: string;
    problem_id: string;
    problems: {
        title: string;
        difficulty: string;
        platform: string;
    };
}

export default function MyLists() {
    const { user } = useAuth();
    const [lists, setLists] = useState<ProblemList[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDesc, setNewListDesc] = useState('');
    const [selectedList, setSelectedList] = useState<ProblemList | null>(null);
    const [listItems, setListItems] = useState<ListItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchLists();
        }
    }, [user]);

    const fetchLists = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_problem_lists')
                .select(`
          *,
          user_problem_list_items(count)
        `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formattedLists = data.map((list: any) => ({
                    ...list,
                    item_count: list.user_problem_list_items?.[0]?.count || 0
                }));
                setLists(formattedLists);
            }
        } catch (err) {
            console.error('Error fetching lists:', err);
        } finally {
            setLoading(false);
        }
    };

    const createList = async () => {
        if (!newListName.trim()) {
            alert('Please enter a list name');
            return;
        }

        if (!user) {
            alert('You must be logged in to create a list');
            return;
        }

        try {
            setCreating(true);
            console.log('Creating list for user:', user.id);

            const { data, error } = await supabase
                .from('user_problem_lists')
                .insert([{
                    user_id: user.id,
                    name: newListName.trim(),
                    description: newListDesc.trim(),
                }])
                .select();

            if (error) {
                console.error('Supabase error creating list:', error);
                throw error;
            }

            if (data && data.length > 0) {
                const newList = { ...data[0], item_count: 0 };
                setLists([newList, ...lists]);
                setNewListName('');
                setNewListDesc('');
                setIsCreating(false);
                setSelectedList(newList);
                fetchListItems(newList.id);
            } else {
                alert('Success, but no data returned from server');
                fetchLists();
                setIsCreating(false);
            }
        } catch (err: any) {
            console.error('Error creating list:', err);
            alert(`Error creating list: ${err.message || 'Unknown error'}`);
        } finally {
            setCreating(false);
        }
    };

    const deleteList = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this list?')) return;
        try {
            const { error } = await supabase
                .from('user_problem_lists')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setLists(lists.filter(l => l.id !== id));
            if (selectedList?.id === id) setSelectedList(null);
        } catch (err) {
            console.error('Error deleting list:', err);
        }
    };

    const fetchListItems = async (listId: string) => {
        try {
            setItemsLoading(true);
            const { data, error } = await supabase
                .from('user_problem_list_items')
                .select(`
          id,
          problem_id,
          problems:problem_id(title, difficulty, platform)
        `)
                .eq('list_id', listId);

            if (error) throw error;
            setListItems(data as any[] || []);
        } catch (err) {
            console.error('Error fetching list items:', err);
        } finally {
            setItemsLoading(false);
        }
    };

    const removeItem = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('user_problem_list_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;
            setListItems(listItems.filter(item => item.id !== itemId));
            setLists(lists.map(l => l.id === selectedList?.id ? { ...l, item_count: (l.item_count || 1) - 1 } : l));
        } catch (err) {
            console.error('Error removing item:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] bg-indigo-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] bg-purple-600/20 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/20">
                                <Bookmark className="w-6 h-6 text-indigo-400" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Personal Library</span>
                        </div>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter">My Lists</h1>
                        <p className="text-gray-400 mt-2">Curate your perfect practice collection</p>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold font-mono transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="w-5 h-5" />
                        Create New List
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Lists Grid (Left Side) - 4 cols */}
                    <div className="lg:col-span-4 space-y-4">
                        <AnimatePresence>
                            {isCreating && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white/5 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-xl mb-6 shadow-2xl shadow-indigo-500/10"
                                >
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <PlusCircle className="w-5 h-5 text-indigo-400" />
                                        New List
                                    </h3>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="List Name (e.g. Meta Top 50)"
                                            value={newListName}
                                            onChange={(e) => setNewListName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                                        />
                                        <textarea
                                            placeholder="Description (optional)"
                                            value={newListDesc}
                                            onChange={(e) => setNewListDesc(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all resize-none h-24"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={createList}
                                                disabled={creating}
                                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                            >
                                                {creating ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                        Creating...
                                                    </>
                                                ) : (
                                                    'Create'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setIsCreating(false)}
                                                className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-3">
                            {lists.map((list) => (
                                <motion.div
                                    key={list.id}
                                    whileHover={{ x: 4 }}
                                    onClick={() => {
                                        setSelectedList(list);
                                        fetchListItems(list.id);
                                    }}
                                    className={`group cursor-pointer p-4 rounded-2xl border transition-all ${selectedList?.id === list.id
                                        ? 'bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-indigo-50 group-hover:text-white transition-colors">
                                                {list.name}
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{list.description || 'No description'}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-full">
                                                    {list.item_count} Problems
                                                </span>
                                                <span className="text-[10px] text-gray-500 uppercase font-bold">
                                                    {new Date(list.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => deleteList(list.id, e)}
                                            className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                            {lists.length === 0 && !isCreating && (
                                <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                                    <Bookmark className="w-8 h-8 text-gray-600 mx-auto mb-3 opacity-50" />
                                    <p className="text-gray-500 text-sm">No lists yet.</p>
                                    <button onClick={() => setIsCreating(true)} className="text-indigo-400 text-xs font-bold hover:underline mt-2">Create one now</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* List Details (Right Side) - 8 cols */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {selectedList ? (
                                <motion.div
                                    key={selectedList.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white/5 border border-white/10 rounded-[32px] p-8 min-h-[600px] backdrop-blur-xl"
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-3xl font-black">{selectedList.name}</h2>
                                                <div className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    <Lock className="w-3 h-3" /> Private
                                                </div>
                                            </div>
                                            <p className="text-gray-400">{selectedList.description || 'Practice this collection to master its core concepts.'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                                                <Share2 className="w-5 h-5 text-gray-400" />
                                            </button>
                                            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                                                <Edit3 className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {itemsLoading ? (
                                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                                            <div className="w-8 h-8 border-2 border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin"></div>
                                            <p className="text-xs text-indigo-400/50 font-bold uppercase tracking-widest">Loading Items...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {listItems.length > 0 ? (
                                                listItems.map((item) => (
                                                    <div key={item.id} className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-2 h-2 rounded-full ${item.problems?.difficulty === 'easy' ? 'bg-green-500' :
                                                                item.problems?.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}></div>
                                                            <div>
                                                                <h5 className="font-bold text-gray-200 group-hover:text-white transition-colors">{item.problems?.title}</h5>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{item.problems?.platform}</span>
                                                                    <span className={`text-[10px] uppercase font-black tracking-widest ${item.problems?.difficulty === 'easy' ? 'text-green-500/70' :
                                                                        item.problems?.difficulty === 'medium' ? 'text-yellow-500/70' : 'text-red-500/70'
                                                                        }`}>
                                                                        {item.problems?.difficulty}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                to={`/solve/${item.problem_id}`}
                                                                className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all border border-indigo-500/10"
                                                            >
                                                                <Play className="w-4 h-4 fill-current" />
                                                            </Link>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="p-3 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-xl transition-all border border-white/5 opacity-0 group-hover:opacity-100"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[28px]">
                                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                        <BookOpen className="w-8 h-8 text-gray-600 opacity-50" />
                                                    </div>
                                                    <h3 className="font-bold text-gray-400">This list is empty</h3>
                                                    <p className="text-xs text-gray-500 mt-1 mb-6">Start adding problems to this collection.</p>
                                                    <Link to="/problems" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20">
                                                        Browse Problems
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[32px] min-h-[600px] text-center p-8 bg-white/5 backdrop-blur-sm">
                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                                        <List className="w-10 h-10 text-indigo-400 opacity-50" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase text-gray-300">Select a Collection</h2>
                                    <p className="text-gray-500 max-w-sm mt-2">
                                        Pick a list from the left to view your saved problems and tracking info.
                                    </p>
                                    <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center">
                                            <Globe className="w-5 h-5 text-indigo-400/50 mb-2" />
                                            <span className="text-[10px] uppercase font-black text-gray-500">Public Sets</span>
                                        </div>
                                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center">
                                            <AlertCircle className="w-5 h-5 text-indigo-400/50 mb-2" />
                                            <span className="text-[10px] uppercase font-black text-gray-500">Drafts</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

function X(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}
