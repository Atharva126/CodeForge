import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('--- Supabase Diagnostic ---');
console.log('URL defined:', !!supabaseUrl);
console.log('Key defined:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Supabase initialization failed: 
    ${!supabaseUrl ? 'Missing VITE_SUPABASE_URL. ' : ''}
    ${!supabaseAnonKey ? 'Missing VITE_SUPABASE_ANON_KEY. ' : ''}
    Please ensure these are set in your Vercel Environment Variables and redeploy.`;
  console.error(errorMsg);
  // We throw a more descriptive error
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
