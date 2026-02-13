import { createClient } from '@supabase/supabase-js';
import { ENV_CONFIG } from '../env_config';

const supabaseUrl = ENV_CONFIG.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = ENV_CONFIG.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `CodeForge Critical Error: Missing Supabase keys.
    Build-time injection: ${!!ENV_CONFIG.VITE_SUPABASE_URL ? 'SUCCESS' : 'FAILED'}
    Runtime check: ${!!import.meta.env.VITE_SUPABASE_URL ? 'SUCCESS' : 'FAILED'}
  `;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
