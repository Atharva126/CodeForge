
export const ENV_CONFIG = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "",
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || "",
  VITE_SARVAM_API_KEY: import.meta.env.VITE_SARVAM_API_KEY || "",
  VITE_COLLAB_SERVER_URL: import.meta.env.VITE_COLLAB_SERVER_URL || "",
  VITE_GROK_API_KEY: import.meta.env.VITE_GROK_API_KEY || "",
  VITE_GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || "",
  VITE_INTERVIEW_API_KEY: import.meta.env.VITE_INTERVIEW_API_KEY || "",
  VITE_SARVAM_PORT: import.meta.env.VITE_SARVAM_PORT || "5000",
  VITE_JITSI_DOMAIN: import.meta.env.VITE_JITSI_DOMAIN || "meet.jit.si"
};
