export default function handler(req, res) {
  // Vercel ki settings se Supabase URL aur Key nikalna jo sabhi frameworks ko support kare
  const rawSupabaseUrl = 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL || 
    process.env.REACT_APP_SUPABASE_URL || 
    '';
    
  const rawAnonKey = 
    process.env.SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.REACT_APP_SUPABASE_ANON_KEY || 
    '';

  // Safai karke exact URL aur Key frontend (index.html) ko bhejna
  const cleanUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '').trim();

  res.status(200).json({
    supabaseUrl: cleanUrl,
    supabaseAnonKey: rawAnonKey
  });
}
