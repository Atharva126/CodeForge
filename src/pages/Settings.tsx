import { useState, useEffect } from 'react';
import {
  Bell,
  Shield,
  Eye,
  EyeOff,
  Code,
  Check,
  X,
  ChevronRight,
  Globe,
  User,
  Mail,
  Lock,
  Clock,
  Zap,
  FileText,
  Monitor,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  publicProfile: boolean;
  showActivity: boolean;
  autoSave: boolean;
  showLineNumbers: boolean;
  wordWrap: boolean;
  autoComplete: boolean;
  livePreview: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';
  timezone: string;
  language: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  publicProfile: true,
  showActivity: true,
  autoSave: true,
  showLineNumbers: true,
  wordWrap: false,
  autoComplete: true,
  livePreview: false,
  emailDigest: 'weekly',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: 'javascript',
};

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
];

export default function Settings() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeSection, setActiveSection] = useState<string>('editor');

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
    }

    // Also try to load from Supabase if user is logged in
    if (user) {
      loadSettingsFromSupabase();
    }
  }, [user]);

  const loadSettingsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data?.settings) {
        // Map keys from JSONB to local state if necessary, 
        // though we kept them mostly consistent
        const dbSettings = data.settings;
        setSettings(prev => ({
          ...prev,
          autoSave: dbSettings.auto_save ?? prev.autoSave,
          showLineNumbers: dbSettings.show_line_numbers ?? prev.showLineNumbers,
          wordWrap: dbSettings.word_wrap ?? prev.wordWrap,
          autoComplete: dbSettings.auto_complete ?? prev.autoComplete,
          livePreview: dbSettings.live_preview ?? prev.livePreview,
          emailNotifications: dbSettings.email_notifications ?? prev.emailNotifications,
          pushNotifications: dbSettings.push_notifications ?? prev.pushNotifications,
          emailDigest: dbSettings.email_digest ?? prev.emailDigest,
          timezone: dbSettings.timezone ?? prev.timezone,
          language: dbSettings.language ?? prev.language,
          publicProfile: dbSettings.public_profile ?? prev.publicProfile,
          showActivity: dbSettings.show_activity ?? prev.showActivity,
        }));
      }
    } catch (error) {
      console.log('Using local settings or defaults');
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');

    try {
      // Save to localStorage (as backup)
      localStorage.setItem('userSettings', JSON.stringify(settings));

      // Save to Supabase if user is logged in
      if (user) {
        const dbSettings = {
          auto_save: settings.autoSave,
          show_line_numbers: settings.showLineNumbers,
          word_wrap: settings.wordWrap,
          auto_complete: settings.autoComplete,
          live_preview: settings.livePreview,
          email_notifications: settings.emailNotifications,
          push_notifications: settings.pushNotifications,
          email_digest: settings.emailDigest,
          timezone: settings.timezone,
          language: settings.language,
          public_profile: settings.publicProfile,
          show_activity: settings.showActivity,
        };

        const { error } = await supabase
          .from('profiles')
          .update({
            settings: dbSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const sections = [
    { id: 'editor', label: 'Code Editor', icon: Code },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
  ];

  const renderSection = () => {
    const cardClass = "flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-all duration-300";
    const labelClass = "font-medium text-gray-900 dark:text-white";
    const subLabelClass = "text-sm text-gray-500 dark:text-gray-400";
    const iconClass = "w-5 h-5 text-gray-500 dark:text-gray-400";

    switch (activeSection) {
      case 'editor':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <RefreshCw className={iconClass} />
                <div>
                  <div className={labelClass}>Auto Save</div>
                  <div className={subLabelClass}>Automatically save your code every 30 seconds</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('autoSave', !settings.autoSave)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoSave ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <Monitor className={iconClass} />
                <div>
                  <div className={labelClass}>Show Line Numbers</div>
                  <div className={subLabelClass}>Display line numbers in the code editor</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showLineNumbers', !settings.showLineNumbers)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showLineNumbers ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showLineNumbers ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <FileText className={iconClass} />
                <div>
                  <div className={labelClass}>Word Wrap</div>
                  <div className={subLabelClass}>Wrap long lines of code</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('wordWrap', !settings.wordWrap)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.wordWrap ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.wordWrap ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <Zap className={iconClass} />
                <div>
                  <div className={labelClass}>Auto Complete</div>
                  <div className={subLabelClass}>Show code suggestions while typing</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('autoComplete', !settings.autoComplete)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoComplete ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoComplete ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <Eye className={iconClass} />
                <div>
                  <div className={labelClass}>Live Preview</div>
                  <div className={subLabelClass}>Show real-time output preview</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('livePreview', !settings.livePreview)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.livePreview ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.livePreview ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className={iconClass} />
                <h3 className={`text-lg font-semibold ${labelClass}`}>Default Language</h3>
              </div>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 transition-colors"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <Mail className={iconClass} />
                <div>
                  <div className={labelClass}>Email Notifications</div>
                  <div className={subLabelClass}>Receive updates about your activity via email</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.emailNotifications ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <Bell className={iconClass} />
                <div>
                  <div className={labelClass}>Push Notifications</div>
                  <div className={subLabelClass}>Receive instant notifications in your browser</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.pushNotifications ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className={iconClass} />
                <h3 className={`text-lg font-semibold ${labelClass}`}>Email Digest</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['daily', 'weekly', 'never'] as const).map((frequency) => (
                  <button
                    key={frequency}
                    onClick={() => updateSetting('emailDigest', frequency)}
                    className={`p-3 rounded-xl border-2 transition-all capitalize ${settings.emailDigest === frequency
                      ? 'border-indigo-600 dark:border-cyan-500 bg-indigo-50 dark:bg-cyan-500/10 text-indigo-700 dark:text-cyan-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    {frequency}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className={iconClass} />
                <h3 className={`text-lg font-semibold ${labelClass}`}>Timezone</h3>
              </div>
              <select
                value={settings.timezone}
                onChange={(e) => updateSetting('timezone', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 transition-colors"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Shanghai">Shanghai (CST)</option>
              </select>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className={cardClass}>
              <div className="flex items-center gap-3">
                {settings.publicProfile ? (
                  <Eye className="w-5 h-5 text-green-500" />
                ) : (
                  <EyeOff className={iconClass} />
                )}
                <div>
                  <div className={labelClass}>Public Profile</div>
                  <div className={subLabelClass}>Make your profile visible to other users</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('publicProfile', !settings.publicProfile)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.publicProfile ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.publicProfile ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <Activity className={iconClass} />
                <div>
                  <div className={labelClass}>Show Activity</div>
                  <div className={subLabelClass}>Let others see your coding activity</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showActivity', !settings.showActivity)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showActivity ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showActivity ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-yellow-500" />
                <h4 className={`font-medium ${labelClass}`}>Security</h4>
              </div>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700/50 text-gray-700 dark:text-gray-300">
                  <span className="text-sm">Change Password</span>
                  <ChevronRight className={iconClass} />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700/50 text-gray-700 dark:text-gray-300">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <ChevronRight className={iconClass} />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700/50 text-gray-700 dark:text-gray-300">
                  <span className="text-sm">Connected Accounts</span>
                  <ChevronRight className={iconClass} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-cyan-500 dark:to-purple-600 flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className={`font-medium ${labelClass}`}>{user?.email?.split('@')[0] || 'User'}</div>
                  <div className={subLabelClass}>{user?.email}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Mail className={iconClass} />
                  <span className={labelClass}>Email Preferences</span>
                </div>
                <ChevronRight className={iconClass} />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Shield className={iconClass} />
                  <span className={labelClass}>Privacy Settings</span>
                </div>
                <ChevronRight className={iconClass} />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Lock className={iconClass} />
                  <span className={labelClass}>Security</span>
                </div>
                <ChevronRight className={iconClass} />
              </button>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Once you delete your account, there is no going back.</p>
              <button className="px-4 py-2 bg-white dark:bg-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f13] text-gray-900 dark:text-white font-sans selection:bg-indigo-500/30 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account preferences and configurations</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeSection === section.id
                      ? 'bg-indigo-50 dark:bg-cyan-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-[#1a1a1f]/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-800/50 shadow-sm dark:shadow-2xl transition-all duration-300">
              {renderSection()}
            </div>

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Changes are saved locally and synced when you click save.
              </div>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 text-white shadow-lg ${saveStatus === 'success'
                  ? 'bg-green-500 hover:bg-green-600 shadow-green-500/25'
                  : saveStatus === 'error'
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                    : 'bg-indigo-600 dark:bg-cyan-500 hover:bg-indigo-700 dark:hover:bg-cyan-600 shadow-indigo-500/25 dark:shadow-cyan-500/25'
                  } disabled:opacity-50`}
              >
                {saveStatus === 'saving' && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {saveStatus === 'success' && <Check className="w-4 h-4" />}
                {saveStatus === 'error' && <X className="w-4 h-4" />}
                {saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}
