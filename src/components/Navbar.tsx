import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, Search, Bell, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import ProfileDrawer from './ProfileDrawer';
import SupportChatbot from './SupportChatbot';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Subscribe to real-time notifications
      const channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', {
          event: 'INSERT', // Only fetch for new ones to avoid race conditions on updates
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchUsers = async () => {
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, rating')
        .ilike('username', `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      // Fetch latest 5 notifications
      const { data: listData, error: listError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (listError) throw listError;
      if (listData) setNotifications(listData);

      // Fetch global unread count
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!countError) {
        setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      // Aggressive Optimistic UI update
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id); // Aggressively target ALL notifications for this user

      if (error) throw error;
      console.log(`[Notifications] Successfully marked all as read. Data:`, data);

      // Sync back with DB after a delay to ensure everything is settled
      setTimeout(fetchNotifications, 1500);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      // On error, let the 1s delay fetch restore the real count
      setTimeout(fetchNotifications, 500);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center">
                <img
                  src="/transparent_logo.png"
                  alt="CodeForge"
                  className="h-32 w-auto opacity-100 dark:invert dark:brightness-200 transition-all duration-300 contrast-125"
                />
              </Link>

              <div className="hidden md:flex items-center space-x-4">
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 dark:text-cyan-500 w-4 h-4 transition-colors group-focus-within:text-cyan-300">
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-cyan-400/30 dark:text-cyan-500/30 text-xs font-mono">{'<'}</div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-cyan-400/30 dark:text-cyan-500/30 text-xs font-mono">{'>'}</div>
                  <input
                    type="text"
                    placeholder="Search summoners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                    className="pl-10 pr-10 py-2 w-64 bg-gray-100 dark:bg-gray-800 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all duration-300"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400/40 dark:text-cyan-500/40 text-xs font-mono opacity-0 group-focus-within:opacity-100 transition-opacity">/</div>

                  {showSearchResults && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Search Results</span>
                        <button onClick={() => setShowSearchResults(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-8 text-center">
                            <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => {
                                navigate(`/profile/${result.username}`);
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 text-left group"
                            >
                              <div className="relative">
                                {result.avatar_url ? (
                                  <img src={result.avatar_url} alt={result.username} className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-cyan-500/50 transition-all" />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center ring-2 ring-transparent group-hover:ring-cyan-500/50 transition-all">
                                    <User className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-900 dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                  {result.username}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{result.full_name || 'Generic Coder'}</span>
                                  <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{result.rating} LP</span>
                                </div>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-cyan-500 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">No users found for "{searchQuery}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors group"
                    >
                      <div className="relative">
                        <Bell className="w-5 h-5" />
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-[10px] flex items-center justify-center text-white font-black shadow-lg shadow-red-500/50 animate-bounce">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                          >
                            Mark all as read
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                className={`p-4 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-cyan-500/5' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-cyan-500' : 'bg-transparent'}`} />
                                  <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">{n.title}</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{n.message}</p>
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5">{new Date(n.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              < Bell className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-3 opacity-50" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">All caught up!</p>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-center">
                          <button className="text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-cyan-500 tracking-widest uppercase">
                            View All Activity
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleTheme();
                }}
                className="relative w-16 h-8 bg-gray-300 dark:bg-gray-700 rounded-full transition-all duration-500 group hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                title="Toggle theme"
              >
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  <div className={`w-6 h-6 flex items-center justify-center transition-all duration-500 ${resolvedTheme === 'light' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                    <div className="text-yellow-400 font-mono text-xs font-bold">&lt;/&gt;</div>
                  </div>
                  <div className={`w-6 h-6 flex items-center justify-center transition-all duration-500 ${resolvedTheme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                    <div className="text-blue-600 dark:text-blue-500 font-mono text-xs font-bold">{ }</div>
                  </div>
                </div>
                <div className={`absolute top-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-blue-600 dark:to-purple-600 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center ${resolvedTheme === 'dark' ? 'translate-x-8 rotate-180' : 'translate-x-1 rotate-0'}`}>
                  {resolvedTheme === 'dark' ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-0.5 h-2.5 bg-white absolute rotate-45"></div>
                      <div className="w-0.5 h-2.5 bg-white absolute -rotate-45"></div>
                      <div className="w-2 h-0.5 bg-white absolute"></div>
                    </div>
                  ) : (
                    <div className="w-3 h-3 bg-white rounded-full shadow-inner"></div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-1000 ${theme === 'dark' ? 'translate-x-0' : '-translate-x-full'}`}></div>
                </div>
              </button>
              <Link to="/problems" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Problems
              </Link>
              <Link to="/contests" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Contests
              </Link>
              <Link to="/interview" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Interview
              </Link>
              <Link to="/explore" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Explore
              </Link>
              <Link to="/discuss" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Discuss
              </Link>
              <Link to="/store" className="relative px-3 py-1.5 text-sm font-medium text-yellow-900 bg-yellow-100 dark:text-yellow-100 dark:bg-yellow-900 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors">
                Store
              </Link>

              {user ? (
                <>
                  <button
                    onClick={() => setProfileDrawerOpen(true)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2 md:hidden">
              {user && (
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">{unreadCount}</span>
                  )}
                </button>
              )}
              <button
                className="text-gray-600 dark:text-gray-400"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4 px-4 sm:px-6 lg:px-8">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="font-mono text-sm">{resolvedTheme === 'dark' ? '&lt;/&gt; Light' : '{} Dark'}</span>
              </button>
              <Link
                to="/problems"
                className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Problems
              </Link>
              <Link
                to="/contests"
                className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contests
              </Link>
              <Link
                to="/explore"
                className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore
              </Link>
              <Link
                to="/discuss"
                className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discuss
              </Link>
              <Link
                to="/store"
                className="block px-3 py-2 text-sm font-medium text-yellow-900 bg-yellow-100 dark:text-yellow-100 dark:bg-yellow-900 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Store
              </Link>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setProfileDrawerOpen(true);
                    }}
                    className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
      <ProfileDrawer
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        onOpenChat={() => setIsChatOpen(true)}
      />
      <SupportChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
