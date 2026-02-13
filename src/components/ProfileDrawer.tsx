import React, { useEffect, useRef, useState } from 'react';
import {
  User,
  CheckSquare,
  Book,
  TrendingUp,
  Sparkles,
  ShoppingBag,
  Code,
  Settings,
  Palette,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Package,
  User as UserIcon,
  Trophy,
  Award,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Play,
  Target,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  is_favorite?: boolean;
}

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}

export default function ProfileDrawer({ isOpen, onClose, onOpenChat }: ProfileDrawerProps) {
  const { user, signOut } = useAuth();
  const { toggleTheme, resolvedTheme } = useTheme();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [purchasedCourses, setPurchasedCourses] = useState<any[]>([]);

  // Fetch profile and notes data when drawer opens
  useEffect(() => {
    if (isOpen && user) {
      const fetchData = async () => {
        try {
          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileData) setProfile(profileData);

          // Fetch notes
          const { data: notesData } = await supabase
            .from('user_notes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

          if (notesData) setNotes(notesData);

          // Fetch purchased courses
          const { data: coursesData } = await supabase
            .from('user_order_items')
            .select(`
              store_items!inner (*)
            `)
            .eq('store_items.category', 'course');
          // Note: RLS on user_orders and user_order_items already filters by auth.uid()
          // based on the policies we saw in create_store_tables.sql

          if (coursesData) {
            const courses = coursesData.map((c: any) =>
              Array.isArray(c.store_items) ? c.store_items[0] : c.store_items
            ).filter(Boolean);

            const uniqueCourses = Array.from(new Map(courses.map(c => [c.id, c])).values());
            setPurchasedCourses(uniqueCourses);
          }
        } catch (error) {
          console.error('Error fetching data in drawer:', error);
        }
      };
      fetchData();
    }
  }, [isOpen, user]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const createNote = async () => {
    if (!user) return;
    if (newNoteTitle.trim() || newNoteContent.trim()) {
      try {
        const { data, error } = await supabase
          .from('user_notes')
          .insert([{
            user_id: user.id,
            title: newNoteTitle.trim() || 'Untitled Note',
            content: newNoteContent.trim(),
          }])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setNotes([data, ...notes]);
          setNewNoteTitle('');
          setNewNoteContent('');
          setIsCreatingNote(false);
        }
      } catch (error) {
        console.error('Error creating note in drawer:', error);
      }
    }
  };

  const updateNote = async (noteId: string, title: string, content: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .update({
          title: title.trim() || 'Untitled Note',
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setNotes(notes.map(note => note.id === noteId ? data : note));
        setEditingNote(null);
      }
    } catch (error) {
      console.error('Error updating note in drawer:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note in drawer:', error);
    }
  };

  const getThemeIcon = () => {
    console.log('ProfileDrawer getThemeIcon called, resolvedTheme:', resolvedTheme);
    switch (resolvedTheme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Moon className="w-4 h-4" />;
    }
  };

  const getThemeLabel = () => {
    console.log('ProfileDrawer getThemeLabel called, resolvedTheme:', resolvedTheme);
    switch (resolvedTheme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Dark';
    }
  };




  return (
    <>
      {/* Backdrop - NO BLUR */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={handleBackdropClick}
      />

      {/* Drawer Container - Fixed width, right aligned, full height */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-200 ease-out overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* User Header - Compact layout */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-3">
            {/* Avatar on the left */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>

            {/* Username and subtitle on the right */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'Anonymous Coder'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Access all features with our Premium subscription
              </p>
              <button className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300 transition-colors">
                Upgrade to Premium →
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick Actions</h4>
            <button
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${isNotesExpanded
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <Book className="w-3 h-3" />
              Notes
              {notes.length > 0 && !isNotesExpanded && (
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/my-lists"
              onClick={onClose}
              className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <CheckSquare className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-2" />
              <div className="text-xs font-medium text-gray-900 dark:text-white">My Lists</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Saved coding problems</div>
            </Link>

            <Link
              to="/progress"
              onClick={onClose}
              className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <TrendingUp className="w-5 h-5 text-purple-500 dark:text-purple-400 mb-2" />
              <div className="text-xs font-medium text-gray-900 dark:text-white">Progress</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Skill tracking</div>
            </Link>

            <Link
              to="/skills"
              onClick={onClose}
              className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <Sparkles className="w-5 h-5 text-pink-500 dark:text-pink-400 mb-2" />
              <div className="text-xs font-medium text-gray-900 dark:text-white">Skills</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">AI Skill Radar</div>
            </Link>

            <Link
              to="/challenges"
              onClick={onClose}
              className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left relative group"
            >
              <Target className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-medium text-gray-900 dark:text-white">Quests</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Daily & Weekly goals</div>
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
            </Link>
          </div>
        </div>


        {/* Expanded Notes Section */}
        {isNotesExpanded && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">My Notes</h4>
              <button
                onClick={() => setIsCreatingNote(true)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                title="Create note"
              >
                <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>
            </div>

            {isCreatingNote && (
              <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-500/30 shadow-sm">
                <input
                  type="text"
                  placeholder="Title..."
                  className="w-full bg-transparent text-sm text-gray-900 dark:text-white mb-2 outline-none font-medium"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  placeholder="Write something..."
                  className="w-full bg-transparent text-xs text-gray-600 dark:text-gray-300 outline-none resize-none min-h-[60px]"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsCreatingNote(false)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={createNote}
                    className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {notes.length === 0 && !isCreatingNote ? (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500">No notes yet.</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="group relative bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700/50 transition-colors shadow-sm">
                    {editingNote === note.id ? (
                      <div>
                        <input
                          type="text"
                          className="w-full bg-transparent text-xs text-gray-900 dark:text-white mb-1 outline-none font-medium"
                          defaultValue={note.title}
                          onBlur={(e) => updateNote(note.id, e.target.value, note.content)}
                          autoFocus
                        />
                        <textarea
                          className="w-full bg-transparent text-[10px] text-gray-500 dark:text-gray-400 outline-none resize-none"
                          defaultValue={note.content}
                          onBlur={(e) => updateNote(note.id, note.title, e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        <h5 className="text-xs font-medium text-gray-900 dark:text-white truncate pr-6">{note.title}</h5>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{note.content}</p>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button onClick={() => setEditingNote(note.id)}>
                            <Edit3 className="w-3 h-3 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400" />
                          </button>
                          <button onClick={() => deleteNote(note.id)}>
                            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <Link
              to="/notes"
              onClick={onClose}
              className="block text-center mt-3 text-[10px] text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium border-t border-gray-200 dark:border-gray-800 pt-2"
            >
              Full Notebook View →
            </Link>
          </div>
        )}

        {/* Navigation Section - Vertical list */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Explorer</h4>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/dashboard';
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">Dashboard</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">stats & progress</span>
              </button>

              <Link
                to="/profile"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">Profile Settings</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">edit profile</span>
              </Link>

              <Link
                to="/badges"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Award className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">Badges</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">achievements</span>
              </Link>

              <Link
                to="/leaderboard"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Trophy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">Leaderboard</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">rankings</span>
              </Link>

              <Link
                to="/my-courses"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Play className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">My Courses</span>
                {purchasedCourses.length > 0 && (
                  <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded">
                    {purchasedCourses.length}
                  </span>
                )}
              </Link>

              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/store';
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">Store</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">courses & goodies</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/orders';
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <ShoppingBag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">Orders</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">purchase history</span>
              </button>

              <Link
                to="/visualizer"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span className="text-sm text-gray-700 dark:text-white">AI Code Visualizer</span>
                <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded">beta</span>
              </Link>

              <Link
                to="/playground"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Code className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">My Playgrounds</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">online code editors</span>
              </Link>

              <Link
                to="/settings"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">Settings</span>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 ml-auto" />
              </Link>

              <button
                onClick={() => {
                  toggleTheme();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-white">Appearance</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{getThemeLabel()}</span>
                  {getThemeIcon()}
                </div>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-800 my-4"></div>

              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Help & Support</h4>
              <button
                onClick={() => {
                  onClose();
                  onOpenChat();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-all text-left group"
              >
                <HelpCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-gray-700 dark:text-white">Chat with ForgeBot</span>
                <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded animate-pulse">new</span>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span className="text-sm text-red-500 dark:text-red-400">Sign Out</span>
              </button>
            </div>
          </div>

          {/* AI Features Section - Compact */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <h4 className="text-xs font-medium text-indigo-600 dark:text-indigo-300">AI Features (Coming Soon)</h4>
              </div>
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                  <span>AI Interview Simulator</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                  <span>AI Weakness Detector</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                  <span>AI Daily Practice Plan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
