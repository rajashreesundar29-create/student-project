// Rename this file to config.js and fill in your Supabase project details.
// Alternatively, the app will request these details in the UI and save them to localStorage.

const SUPABASE_CONFIG = {
  SUPABASE_URL: "https://hejxxterrhtbtbzivunu.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_g-UP3MhjeBtdgpitmm78RQ_NoU9Lz7f"
};

// Expose configuration globally if config.js is loaded
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
