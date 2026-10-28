import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kslmyvlewsmjnrhwklfd.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HxPK4_XJRllpINvKnlAc3A_vMvzcgAc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
