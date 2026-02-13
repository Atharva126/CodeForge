import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  const [isClient, setIsClient] = useState(false);

  // Initialize theme on client side
  useEffect(() => {
    setIsClient(true);
    
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      let initialTheme: Theme;
      
      if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
        initialTheme = savedTheme;
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        initialTheme = prefersDark ? 'dark' : 'light';
        localStorage.setItem('theme', initialTheme);
      }
      
      setThemeState(initialTheme);
      setResolvedTheme(initialTheme);
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Fallback to dark mode
      setThemeState('dark');
      setResolvedTheme('dark');
    }
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (typeof document === 'undefined' || !isClient) return;
    
    try {
      const root = document.documentElement;
      
      // Remove all theme classes first
      root.classList.remove('dark', 'light');
      
      // Add current theme class
      root.classList.add(resolvedTheme);
      
      // Update localStorage
      localStorage.setItem('theme', theme);
      
      console.log('Theme applied:', { theme, resolvedTheme });
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [theme, resolvedTheme, isClient]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    
    console.log('Toggling theme from', theme, 'to', newTheme);
    console.log('Current theme state before update:', theme);
    console.log('Current resolvedTheme before update:', resolvedTheme);
    
    setThemeState(newTheme);
    setResolvedTheme(newTheme);
    
    console.log('Theme state after update:', newTheme);
    console.log('ResolvedTheme after update:', newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    if (['dark', 'light'].includes(newTheme)) {
      console.log('Setting theme to:', newTheme);
      setThemeState(newTheme);
      setResolvedTheme(newTheme);
    }
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    resolvedTheme
  };

  // Prevent hydration mismatch by rendering a simple div until client is ready
  if (!isClient) {
    return (
      <ThemeContext.Provider value={value}>
        <div className="dark">
          {children}
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
