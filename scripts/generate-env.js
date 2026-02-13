const fs = require('fs');
const path = require('path');

const envConfig = `
export const ENV_CONFIG = {
  VITE_SUPABASE_URL: "${process.env.VITE_SUPABASE_URL || ''}",
  VITE_SUPABASE_ANON_KEY: "${process.env.VITE_SUPABASE_ANON_KEY || ''}",
  VITE_GEMINI_API_KEY: "${process.env.VITE_GEMINI_API_KEY || ''}"
};
`;

const targetPath = path.join(__dirname, '..', 'src', 'env_config.ts');
fs.writeFileSync(targetPath, envConfig);

console.log('--- ENV INJECTION COMPLETE ---');
console.log('Target:', targetPath);
console.log('URL PRESENT:', !!process.env.VITE_SUPABASE_URL);
