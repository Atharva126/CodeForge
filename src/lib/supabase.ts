import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : undefined);

console.log('--- Supabase Diagnostic ---');
console.log('URL defined:', !!supabaseUrl);
console.log('Key defined:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `CODEFORGE_CRITICAL_ERROR: Supabase variables are not being detected by the client. 
    URL_STATUS: ${supabaseUrl ? 'DETECTED' : 'MISSING'}
    KEY_STATUS: ${supabaseAnonKey ? 'DETECTED' : 'MISSING'}
    This is happening on the Vercel build. Please check your Environment Variables tab again.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
