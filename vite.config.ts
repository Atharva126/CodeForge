import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // LOGS FOR BUILD DASHBOARD (Check "Build Logs" in Vercel)
  console.log('--- VERCEL BUILD DIAGNOSTIC ---');
  console.log('MODE:', mode);
  console.log('VITE_SUPABASE_URL (from loadEnv):', env.VITE_SUPABASE_URL ? 'PRESENT' : 'MISSING');
  console.log('VITE_SUPABASE_URL (from process.env):', process.env.VITE_SUPABASE_URL ? 'PRESENT' : 'MISSING');

  return {
    plugins: [react()],
    define: {
      // Force injection with multiple fallback sources
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''),
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
