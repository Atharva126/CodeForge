import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Github, Twitter, Linkedin, Camera, Edit2, Save, X, MapPin, Globe, Shield, Bell, Settings, LogOut, Crown, Trophy, Target, Star, Award, Sword, Zap, Eye, Search, UserPlus, UserMinus, Layout, Activity, Calendar as CalendarIcon, Bookmark, ChevronRight, ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, subYears } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BADGES } from '../types/badges';

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  location: string;
  website: string;
  github: string;
  twitter: string;
  linkedin: string;
  rating: number;
  streak: number;
  problems_solved: number;
  acceptance_rate: number;
  forge_coins: number;
  global_rank: number;
  created_at: string;
  email_notifications: boolean;
  public_profile: boolean;
  followers_count: number;
  following_count: number;
  is_official: boolean;
  is_pro: boolean;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { username: urlUsername } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'certifications' | 'activity' | 'settings'>('overview');
  const [submissionStats, setSubmissionStats] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [userCertificates, setUserCertificates] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !urlUsername || (user && profile && user.id === profile.id);

  const [formData, setFormData] = useState<ProfileData>({
    id: '',
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
    location: '',
    website: '',
    github: '',
    twitter: '',
    linkedin: '',
    rating: 0,
    streak: 0,
    problems_solved: 0,
    acceptance_rate: 0,
    forge_coins: 0,
    global_rank: 0,
    created_at: '',
    email_notifications: true,
    public_profile: true,
    followers_count: 0,
    following_count: 0,
    is_official: false,
    is_pro: false
  });

  useEffect(() => {
    loadProfile();
  }, [user, urlUsername]);

  const loadCertificates = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_certificates')
        .select(`
          *,
          store_items (
            name,
            instructor,
            image
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const enrichedCertificates = (data || []).map(cert => ({
        ...cert,
        store_items: Array.isArray(cert.store_items) ? cert.store_items[0] : cert.store_items
      }));

      setUserCertificates(enrichedCertificates);
    } catch (err) {
      console.error('Error loading certificates:', err);
    }
  };

  const checkFollowStatus = async (targetId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);

        if (error) throw error;
        setIsFollowing(false);
        setProfile(prev => prev ? { ...prev, followers_count: Math.max(0, prev.followers_count - 1) } : null);
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followers')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          });

        if (error) throw error;
        setIsFollowing(true);
        setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const identifier = urlUsername || user?.id;
      if (!identifier) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq(urlUsername ? 'username' : 'id', identifier)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Check follow status if viewing someone else
        if (user && data.id !== user.id) {
          checkFollowStatus(data.id);
        }

        // Fetch detailed stats for charts
        const { data: subsDetailed } = await supabase
          .from('user_submissions')
          .select(`
            status,
            problem_id,
            submitted_at,
            problems!inner (
              difficulty,
              tags
            )
          `)
          .eq('user_id', data.id);

        const subsRaw = (subsDetailed as any[]) || [];
        const accepted = subsRaw.filter(s => s.status === 'Accepted');

        // Difficulty split
        const difficultyData = [
          { name: 'Easy', value: accepted.filter(s => s.problems?.difficulty === 'easy').length, color: '#22c55e' },
          { name: 'Medium', value: accepted.filter(s => s.problems?.difficulty === 'medium').length, color: '#eab308' },
          { name: 'Hard', value: accepted.filter(s => s.problems?.difficulty === 'hard').length, color: '#ef4444' },
        ];

        // Skill Radar Categories
        const categories = {
          'Arrays & Hashing': ['array', 'hash-table', 'matrix', 'prefix-sum', 'sliding-window', 'two-pointers'],
          'Strings': ['string', 'string-matching'],
          'Basic Algos': ['math', 'sorting', 'binary-search', 'greedy', 'two-pointers', 'recursion', 'simulation'],
          'Adv. Algos': ['dynamic-programming', 'backtracking', 'recursion', 'divide-and-conquer', 'bit-manipulation'],
          'Data Structures': ['stack', 'queue', 'heap', 'linked-list', 'ordered-set', 'monotonic-stack'],
          'Graph & Tree': ['tree', 'binary-tree', 'graph', 'dfs', 'bfs', 'union-find', 'trie', 'segment-tree']
        };

        const skillCounts: Record<string, number> = {
          'Arrays & Hashing': 0,
          'Strings': 0,
          'Basic Algos': 0,
          'Adv. Algos': 0,
          'Data Structures': 0,
          'Graph & Tree': 0
        };

        accepted.forEach(s => {
          const problemTags = s.problems?.tags || [];
          Object.entries(categories).forEach(([category, tags]) => {
            if (problemTags.some((tag: string) => tags.includes(tag))) {
              skillCounts[category] += 1;
            }
          });
        });

        // Normalize to a 0-100 scale (roughly, for visualization)
        const maxVal = Math.max(...Object.values(skillCounts), 1);
        const skillData = Object.entries(skillCounts).map(([name, value]) => ({
          name,
          value: Math.min(100, Math.round((value / maxVal) * 80) + 20), // Minimum base for visibility
          raw: value
        }));

        // Generate AI-like recommendation
        const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
        const topSkill = sortedSkills[0];
        const bottomSkill = sortedSkills[sortedSkills.length - 1];

        let aiRecommendation = "Start solving problems to get personalized AI insights!";
        if (accepted.length > 0) {
          if (topSkill[1] === bottomSkill[1]) {
            aiRecommendation = "You have a very balanced skill set! Keep exploring different categories to level up.";
          } else {
            aiRecommendation = `Your ${topSkill[0]} skill is impressive! To improve further, try focusing on ${bottomSkill[0]} problems.`;
          }
        }

        setSubmissionStats({
          difficultyData,
          skillData,
          aiRecommendation,
          totalSolved: accepted.length,
          recentAccepted: accepted.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()).slice(0, 5)
        });

        // Fetch Activity for Heatmap
        const { data: acts } = await supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', data.id)
          .gte('created_at', subYears(new Date(), 1).toISOString());

        const heatmapData = acts?.map(a => ({
          date: format(new Date(a.created_at), 'yyyy-MM-dd'),
          count: 1
        })) || [];
        setActivityData(heatmapData);

        // Fetch Badges
        const { data: userBadgeData } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', data.id);

        const enrichedBadges = (userBadgeData || []).map(ub => {
          const badgeMeta = BADGES.find(b => b.id === ub.badge_id);
          return {
            ...ub,
            ...badgeMeta
          };
        }).filter(b => b.name); // Ensure we have the metadata

        setUnlockedBadges(enrichedBadges);
        loadCertificates(data.id);

        // Retroactive badge sync for own profile (Non-blocking)
        if (isOwnProfile) {
          import('../services/badgeService').then(async (m) => {
            await m.default.syncAndCheck(data.id, 'all');
            // We don't call loadProfile() again to avoid loops
            // Instead, we trust the next visit/manual reload will show them
            // or just rely on the fact that syncAndCheck is non-blocking.
          });
        }

        const enrichedProfile: ProfileData = {
          ...data,
          problems_solved: accepted.length || data.problems_solved,
          followers_count: data.followers_count || 0,
          following_count: data.following_count || 0,
          is_official: !!data.is_official,
          is_pro: !!data.is_pro
        };

        setProfile(enrichedProfile);
        if (isOwnProfile) {
          setFormData(enrichedProfile);
        }
      } else if (isOwnProfile && user) {
        // Create default profile for logged in user if it doesn't exist
        const defaultProfile: ProfileData = {
          id: user.id,
          username: user.email?.split('@')[0] || 'Anonymous',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous User',
          bio: 'Passionate coder and problem solver.',
          avatar_url: '',
          location: '',
          website: '',
          github: '',
          twitter: '',
          linkedin: '',
          rating: 1200,
          streak: 0,
          problems_solved: 0,
          acceptance_rate: 0,
          forge_coins: 0,
          global_rank: 0,
          created_at: new Date().toISOString(),
          email_notifications: true,
          public_profile: true,
          followers_count: 0,
          following_count: 0,
          is_official: false,
          is_pro: false
        };
        setProfile(defaultProfile);
        setFormData(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

      console.log('Uploading image:', fileName);

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        // If bucket doesn't exist, use a placeholder or data URL
        if (error.message.includes('not found') || error.message.includes('Bucket')) {
          console.warn('Storage bucket not found, using local preview');
          // Create a local preview URL
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
          };
          reader.readAsDataURL(file);
          return;
        }
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Image uploaded successfully:', publicUrl);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again or continue without changing the image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Prepare the data to be saved (updated_at is handled by database trigger)
      const profileData = {
        id: user?.id,
        username: formData.username,
        full_name: formData.full_name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        location: formData.location,
        website: formData.website,
        github: formData.github,
        twitter: formData.twitter,
        linkedin: formData.linkedin,
        email_notifications: formData.email_notifications,
        public_profile: formData.public_profile,
      };

      console.log('Saving profile data:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Profile saved successfully:', data);

      // Update local state with the saved data
      if (data) {
        setProfile(data);
        setFormData(data);
      } else {
        setProfile(formData);
      }

      setIsEditing(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      console.error('Error saving profile:', error);

      let msg = error.message || 'Failed to save profile.';
      if (error.code === '23505') msg = 'Username already taken. Please choose another one.';

      alert(`Error: ${msg}`);

      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // handleCancel removed from JSX but can be kept for future or deleted if truly unused.
  // Deleting to satisfy linter for now.

  const getTier = (_r: number, rank: number) => {
    // Sync with Leaderboard logic
    const totalUsers = 1000;
    const percentile = ((totalUsers - rank) / totalUsers) * 100;

    if (rank === 1 || rank === 2 || rank === 3 || percentile >= 99) return 'Immortal';
    if (percentile >= 97) return 'Sovereign';
    if (percentile >= 93) return 'Apex';
    if (percentile >= 85) return 'Supreme';
    if (percentile >= 75) return 'Overlord';
    if (percentile >= 60) return 'Warlord';
    if (percentile >= 40) return 'Titan';
    if (percentile >= 25) return 'Alpha';
    if (percentile >= 10) return 'Predator';
    if (percentile >= 2) return 'Hunter';
    return 'Rookie';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Immortal': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'Sovereign': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'Apex': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Supreme': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Overlord': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case 'Warlord': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Titan': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Alpha': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Predator': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Hunter': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Immortal': return <Crown className="w-5 h-5" />;
      case 'Sovereign': return <Trophy className="w-5 h-5" />;
      case 'Apex': return <Target className="w-5 h-5" />;
      case 'Supreme': return <Star className="w-5 h-5" />;
      case 'Overlord': return <Award className="w-5 h-5" />;
      case 'Warlord': return <Sword className="w-5 h-5" />;
      case 'Titan': return <Shield className="w-5 h-5" />;
      case 'Alpha': return <Zap className="w-5 h-5" />;
      case 'Predator': return <Eye className="w-5 h-5" />;
      case 'Hunter': return <Search className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Profile not found</div>
      </div>
    );
  }

  const tier = getTier(profile.rating, profile.global_rank);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white selection:bg-orange-500/30 transition-colors duration-300">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 dark:bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 dark:bg-purple-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 font-bold text-sm"
        >
          <div className="p-2 bg-gray-900/50 rounded-xl border border-gray-800/50 group-hover:border-gray-700 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to previous
        </button>

        {/* Profile Header Hero */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12">
          <div className="relative group">
            <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-orange-500 via-pink-600 to-purple-600 p-1 shadow-2xl shadow-orange-500/20 group-hover:scale-105 transition-transform duration-500">
              <div className="w-full h-full rounded-[20px] bg-gray-950 flex items-center justify-center overflow-hidden border border-white/5">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-800" />
                )}
              </div>
            </div>
            {isOwnProfile && isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 p-3 bg-white text-gray-900 rounded-2xl shadow-xl hover:scale-110 transition-transform disabled:opacity-50"
              >
                {isUploading ? <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight">{profile.full_name}</h1>
                {profile.is_official ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 text-[10px] font-black uppercase tracking-tighter shadow-indigo-500/20 shadow-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </div>
                ) : profile.is_pro ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20 text-[10px] font-black uppercase tracking-tighter shadow-yellow-500/20 shadow-lg">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Pro
                  </div>
                ) : null}
              </div>
              <div className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 self-center md:self-auto ${getTierColor(tier)}`}>
                {getTierIcon(tier)}
                {tier}
              </div>
            </div>

            <p className="text-gray-400 font-medium max-w-xl line-clamp-2">
              {profile.bio || "Crafting elegant solutions to complex problems one line at a time."}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{profile.location || "Earth"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Globe className="w-4 h-4" />
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {profile.website ? profile.website.replace('https://', '') : 'codeforge.com'}
                </a>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-white">{profile.followers_count}</span>
                <span className="text-gray-500 uppercase text-[10px] tracking-widest">Followers</span>
                <span className="text-white ml-2">{profile.following_count}</span>
                <span className="text-gray-500 uppercase text-[10px] tracking-widest">Following</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[160px]">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full py-3 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-xl"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isFollowing ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  }`}
              >
                {followLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? 'Unfollow' : 'Follow User'}
              </button>
            )}
            {isOwnProfile && (
              <button
                onClick={signOut}
                className="w-full py-3 bg-gray-900 border border-gray-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4 text-gray-500" />
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center border-b border-gray-800/50 mb-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Layout },
            { id: 'badges', label: 'Achievements', icon: Award },
            { id: 'certifications', label: 'Certifications', icon: Shield },
            { id: 'activity', label: 'History', icon: Activity },
            ...(isOwnProfile ? [{ id: 'settings', label: 'Settings', icon: Settings }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-4 flex items-center gap-2 font-bold text-sm transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-orange-500' : 'text-gray-600'}`} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-orange-500 to-pink-600 rounded-t-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8 animate-in fade-in fade-out slide-in-from-bottom-4 duration-700">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Solved Breakdown */}
              <div className="lg:col-span-1 bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                  Solved Problems
                  <span className="text-3xl font-black text-white">{profile.problems_solved}</span>
                </h3>

                <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={submissionStats?.difficultyData || []}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {submissionStats?.difficultyData?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-gray-500 uppercase font-black">All</span>
                    <span className="text-2xl font-black">{profile.problems_solved}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {submissionStats?.difficultyData?.map((d: any) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-gray-400 font-medium">{d.name}</span>
                      </div>
                      <span className="font-bold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Middle Column: Skills & Badges */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-orange-500" />
                      AI Skill Radar
                    </h3>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 text-[10px] font-black uppercase tracking-tighter">
                      Beta
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="h-64 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={submissionStats?.skillData || []}>
                          <PolarGrid stroke="#374151" />
                          <PolarAngleAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Skills"
                            dataKey="value"
                            stroke="#f97316"
                            strokeWidth={2}
                            fill="#f97316"
                            fillOpacity={0.4}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                          <Sparkles className="w-8 h-8 text-orange-500" />
                        </div>
                        <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-3">AI Insights</h4>
                        <p className="text-sm text-gray-400 leading-relaxed font-medium italic">
                          "{submissionStats?.aiRecommendation}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {submissionStats?.skillData?.slice(0, 4).map((skill: any) => (
                          <div key={skill.name} className="space-y-1">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{skill.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${skill.value}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-300">{skill.raw}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Featured Achievements</h3>
                    <Link to="/badges" className="text-xs text-orange-500 hover:text-orange-400 font-bold">View all</Link>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                    {unlockedBadges.slice(0, 6).map((badge, idx) => (
                      <div key={idx} title={badge.name} className="aspect-square rounded-2xl bg-gray-800/50 flex flex-col items-center justify-center group relative cursor-pointer hover:bg-orange-500/10 transition-colors border border-gray-700/50">
                        <div className="text-2xl mb-1">{badge.icon || '🏆'}</div>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-2xl ring-1 ring-white/20 transition-opacity" />
                      </div>
                    ))}
                    {unlockedBadges.length === 0 && (
                      <div className="col-span-full py-8 text-center text-gray-500 italic text-sm">
                        No badges unlocked yet. Start solving problems to earn them!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {unlockedBadges.map((badge, idx) => (
                <div key={idx} className="bg-gray-900/40 backdrop-blur-md p-6 rounded-3xl border border-gray-800/50 flex flex-col items-center text-center group hover:border-orange-500/30 transition-all">
                  <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <div className="text-4xl">{badge.icon || '🏆'}</div>
                  </div>
                  <h4 className="font-bold text-white mb-1">{badge.name}</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-3">{badge.rarity}</p>
                  <p className="text-xs text-gray-400 line-clamp-2 px-2">
                    {badge.description}
                  </p>
                </div>
              ))}
              {unlockedBadges.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Award className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Go forth and conquer problems to unlock your first badge!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'certifications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userCertificates.map((cert, idx) => {
                const storeItem = cert.store_items;
                if (!storeItem) return null;

                return (
                  <div key={idx} className="bg-gray-900/40 backdrop-blur-md p-8 rounded-[32px] border border-gray-800/50 flex gap-6 group hover:border-indigo-500/30 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5">
                      <img src={storeItem.image} alt={storeItem.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Verified Certificate</p>
                        <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[8px] font-black border border-indigo-500/20">
                          {cert.certificate_id}
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase italic">{storeItem.name}</h4>
                      <p className="text-sm text-gray-400 font-medium">Instructor: {storeItem.instructor}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                        <CalendarIcon className="w-3 h-3" />
                        Issued {format(new Date(cert.issued_at), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                );
              })}
              {userCertificates.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Shield className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm italic font-medium tracking-tight">Master a course to earn your first verified certificate!</p>
                  <Link to="/store" className="inline-block mt-6 text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase tracking-widest">Browse Courses →</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-8">
              {/* Contribution Heatmap */}
              <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 p-8 overflow-hidden">
                <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-orange-500" />
                  Contribution Map
                </h3>
                <div className="heatmap-container -mx-4 overflow-x-auto">
                  <div className="min-w-[800px] px-4">
                    <CalendarHeatmap
                      startDate={subYears(new Date(), 1)}
                      endDate={new Date()}
                      values={activityData}
                      classForValue={(value) => {
                        if (!value) return 'color-empty';
                        return 'color-scale-4';
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                  Less <div className="flex gap-1"><div className="w-2.5 h-2.5 bg-gray-800 rounded-sm" /><div className="w-2.5 h-2.5 bg-orange-900 rounded-sm" /><div className="w-2.5 h-2.5 bg-orange-700 rounded-sm" /><div className="w-2.5 h-2.5 bg-orange-500 rounded-sm" /></div> More
                </div>
              </div>

              {/* Submission History */}
              <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 overflow-hidden">
                <div className="p-8 border-b border-gray-800/50 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Recent History</h3>
                  <div className="p-2 bg-gray-800/50 rounded-xl">
                    <Bookmark className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
                <div className="divide-y divide-gray-800/50 font-medium">
                  {submissionStats?.recentAccepted.map((sub: any, idx: number) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${sub.problems.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
                          sub.problems.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                          {sub.problems.difficulty.substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="font-bold text-white group-hover:text-orange-500 transition-colors">{sub.problems.title}</h5>
                          <p className="text-xs text-gray-500 mt-1">
                            Accepted • {format(new Date(sub.submitted_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
                    </div>
                  ))}
                  {(!submissionStats?.recentAccepted || submissionStats.recentAccepted.length === 0) && (
                    <div className="p-12 text-center text-gray-500 italic">No recent activity detected.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && isOwnProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: General Settings */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">General Information</h3>
                    <button
                      onClick={handleSave}
                      disabled={saveStatus === 'saving'}
                      className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
                    >
                      {saveStatus === 'saving' ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Full Name</label>
                      <input
                        type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Username</label>
                      <input
                        type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                      />
                    </div>
                    <div className="col-span-full space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Bio</label>
                      <textarea
                        rows={4} value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 p-8">
                  <h3 className="text-xl font-bold mb-8">Social Presence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-400">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest pl-1">
                        <Github className="w-3 h-3" /> GitHub
                      </label>
                      <input
                        type="text" value={formData.github} onChange={e => setFormData({ ...formData, github: e.target.value })}
                        className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                        placeholder="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest pl-1">
                        <Twitter className="w-3 h-3" /> Twitter
                      </label>
                      <input
                        type="text" value={formData.twitter} onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                        className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                        placeholder="@username"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest pl-1">
                        <Linkedin className="w-3 h-3" /> LinkedIn
                      </label>
                      <input
                        type="text" value={formData.linkedin} onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                        className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                        placeholder="username"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Preferences & Account */}
              <div className="space-y-8">
                <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    Preferences
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg"><Eye className="w-4 h-4 text-blue-400" /></div>
                        <span className="text-sm font-bold">Public Profile</span>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, public_profile: !formData.public_profile })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${formData.public_profile ? 'bg-orange-500' : 'bg-gray-800'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.public_profile ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg"><Bell className="w-4 h-4 text-orange-400" /></div>
                        <span className="text-sm font-bold">Email Alerts</span>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, email_notifications: !formData.email_notifications })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${formData.email_notifications ? 'bg-orange-500' : 'bg-gray-800'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.email_notifications ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
                  <h3 className="text-lg font-bold text-red-400 mb-4 tracking-tight">Danger Zone</h3>
                  <p className="text-xs text-gray-500 mb-6 font-medium">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  <button className="w-full py-3 border border-red-500/30 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .heatmap-container rect.color-empty { fill: #111827; }
        .heatmap-container rect.color-scale-1 { fill: #431407; }
        .heatmap-container rect.color-scale-2 { fill: #7c2d12; }
        .heatmap-container rect.color-scale-3 { fill: #ea580c; }
        .heatmap-container rect.color-scale-4 { fill: #f97316; }
        .heatmap-container .react-calendar-heatmap rect {
          rx: 2px;
          ry: 2px;
        }
      `}</style>
    </div>
  );
}
