import { createClient } from '@supabase/supabase-js';

// ============================================================================
// DYNAMIC SUPABASE CLIENT FOR WEARSTAY (DESIGNHUB GLOBAL)
// Connects dynamically to Vercel environment variables (ZERO hardcoded URLs)
// ============================================================================

export const getResolvedSupabaseUrl = () => {
  // 1. Vite environment variables (import.meta.env)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
    if (viteUrl && viteUrl.startsWith('http') && !viteUrl.includes('pmfxyexwxwshbucjkgtwj')) {
      return viteUrl.trim();
    }
  }

  // 2. Browser window bridge
  if (typeof window !== 'undefined') {
    const win = window;
    const winUrl = win.VITE_SUPABASE_URL || win.SUPABASE_URL || win.NEXT_PUBLIC_SUPABASE_URL;
    if (winUrl && typeof winUrl === 'string' && winUrl.startsWith('http') && !winUrl.includes('pmfxyexwxwshbucjkgtwj')) {
      return winUrl.trim();
    }

    try {
      const stored = localStorage.getItem('wearstay_supabase_url');
      if (stored && stored.startsWith('http') && !stored.includes('pmfxyexwxwshbucjkgtwj')) {
        return stored.trim();
      }
    } catch {}
  }

  // 3. Node / Server environment
  if (typeof process !== 'undefined' && process.env) {
    const procUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (procUrl && procUrl.startsWith('http') && !procUrl.includes('pmfxyexwxwshbucjkgtwj')) {
      return procUrl.trim();
    }
  }

  return '';
};

export const getResolvedSupabaseAnonKey = () => {
  // 1. Vite environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (viteKey && viteKey.trim() && !viteKey.includes('YamN7OYn')) {
      return viteKey.trim();
    }
  }

  // 2. Browser window bridge
  if (typeof window !== 'undefined') {
    const win = window;
    const winKey = win.VITE_SUPABASE_ANON_KEY || win.SUPABASE_ANON_KEY || win.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (winKey && typeof winKey === 'string' && winKey.trim() && !winKey.includes('YamN7OYn')) {
      return winKey.trim();
    }

    try {
      const stored = localStorage.getItem('wearstay_supabase_anon_key');
      if (stored && stored.trim() && !stored.includes('YamN7OYn')) {
        return stored.trim();
      }
    } catch {}
  }

  // 3. Node environment
  if (typeof process !== 'undefined' && process.env) {
    const procKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (procKey && procKey.trim() && !procKey.includes('YamN7OYn')) {
      return procKey.trim();
    }
  }

  return '';
};

export const supabaseUrl = getResolvedSupabaseUrl();
export const supabaseAnonKey = getResolvedSupabaseAnonKey();

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

// Fallback dynamic async initializer
export async function getLiveSupabaseClient() {
  const currentUrl = getResolvedSupabaseUrl();
  const currentKey = getResolvedSupabaseAnonKey();

  if (currentUrl && currentKey && !currentUrl.includes('placeholder')) {
    return supabase;
  }

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const cfg = await res.json();
        if (cfg.supabaseUrl && cfg.supabaseAnonKey && cfg.supabaseUrl.startsWith('http')) {
          return createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storage: window.localStorage,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch /api/config for Supabase client:', err);
    }
  }

  return supabase;
}

// ----------------------------------------------------------------------------
// GOOGLE OAUTH & AUTHENTICATION ACTIONS
// ----------------------------------------------------------------------------

export async function signInWithGoogle(redirectTo) {
  const client = await getLiveSupabaseClient();
  const redirectOrigin = redirectTo || (typeof window !== 'undefined' ? window.location.origin : 'https://www.wearstay.com');

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectOrigin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Google Sign-In Error:', error.message);
    throw error;
  }

  return data;
}

export async function signOut() {
  const client = await getLiveSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dh_user_email');
    localStorage.removeItem('dh_user_credits');
    localStorage.removeItem('dh_has_subscription');
    localStorage.removeItem('dh_user_plan');
  }
}

export async function getCurrentUser() {
  const client = await getLiveSupabaseClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getCurrentSession() {
  const client = await getLiveSupabaseClient();
  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session) return null;
  return session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null, session || null);
  });
}

export default supabase;
