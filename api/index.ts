import { createClient } from '@supabase/supabase-js'

// Yahan process.env ya import.meta ki jagah seedha apna URL aur Key daalein (quotes ' ' ke andar)
const supabaseUrl = 'https://pnfxyxexxhbucjkgtwxj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Yahan apni poori SUPABASE_ANON_KEY paste karein

export const supabase = createClient(supabaseUrl, supabaseKey)
