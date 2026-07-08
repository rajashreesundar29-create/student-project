/**
 * Supabase Client Initialization
 * Resolves credentials from:
 * 1. window.SUPABASE_CONFIG (defined in config.js)
 * 2. localStorage ('SUPABASE_URL' and 'SUPABASE_ANON_KEY')
 */

(function () {
  let supabaseUrl = "";
  let supabaseAnonKey = "";

  // 1. Try to load from config.js if present
  if (window.SUPABASE_CONFIG) {
    supabaseUrl = window.SUPABASE_CONFIG.SUPABASE_URL;
    supabaseAnonKey = window.SUPABASE_CONFIG.SUPABASE_ANON_KEY;
  }

  // 2. Try to load from localStorage if not configured via config.js
  if (!supabaseUrl || supabaseUrl.includes("your-project-id")) {
    supabaseUrl = localStorage.getItem("SUPABASE_URL") || "";
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes("your-anon-public-key")) {
    supabaseAnonKey = localStorage.getItem("SUPABASE_ANON_KEY") || "";
  }

  // Expose credentials helper
  window.getSupabaseCredentials = function () {
    return {
      url: supabaseUrl,
      key: supabaseAnonKey,
      isConfigured: !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project-id"))
    };
  };

  window.saveSupabaseCredentials = function (url, key) {
    localStorage.setItem("SUPABASE_URL", url);
    localStorage.setItem("SUPABASE_ANON_KEY", key);
    supabaseUrl = url;
    supabaseAnonKey = key;
    // Re-initialize client
    initClient();
  };

  window.clearSupabaseCredentials = function () {
    localStorage.removeItem("SUPABASE_URL");
    localStorage.removeItem("SUPABASE_ANON_KEY");
    supabaseUrl = "";
    supabaseAnonKey = "";
    window.supabase = null;
  };

  function initClient() {
    const creds = window.getSupabaseCredentials();
    if (creds.isConfigured) {
      try {
        // supabase is loaded from CDN in index.html: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
        if (window.supabase) {
          // If already defined or recreated, we re-initialize it
          window.supabaseClient = window.supabase.createClient(creds.url, creds.key, {
            auth: {
              persistSession: true,
              autoRefreshToken: true
            }
          });
        }
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
      }
    } else {
      window.supabaseClient = null;
    }
  }

  // Initial execution (runs when script is loaded)
  // We check if the CDN supabase global object is loaded. If not, wait for DOM/load.
  if (window.supabase) {
    initClient();
  } else {
    window.addEventListener("load", initClient);
  }
})();
