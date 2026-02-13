import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { gamificationService } from '../services/gamificationService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test Supabase connection
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in with:', { email, passwordLength: password.length });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Sign in response:', { data, error });
    if (error) {
      console.error('Sign in error details:', error);
      throw error;
    }
    console.log('Sign in successful:', data.user?.email);
    
    // Update login streak and award login points
    if (data.user) {
      try {
        await gamificationService.updateLoginStreak(data.user.id);
        console.log('Login streak updated successfully');
      } catch (streakError) {
        console.error('Error updating login streak:', streakError);
      }
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    console.log('Attempting signup with:', { email, username, passwordLength: password.length });
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error('Supabase auth error:', error);
      throw error;
    }

    console.log('Supabase auth success:', data);

    if (data.user) {
      // Try to create profile, but don't fail if table doesn't exist
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username, full_name: username }]);

        if (profileError) {
          console.log('Profile creation failed, but user was created:', profileError.message);
          // Don't throw error - user was created successfully
        } else {
          console.log('Profile created successfully');
        }
      } catch (err) {
        console.log('Profiles table might not exist yet, but user was created successfully');
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
