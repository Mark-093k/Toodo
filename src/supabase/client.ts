import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

type SupabaseClient = ReturnType<typeof createClient<any>>;

let client: SupabaseClient | null = null;

export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const getSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  client ??= createClient<any>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return client;
};

export const getSupabaseUserId = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  const userId = data.session?.user.id;
  if (!userId) {
    throw new Error('Supabase 로그인이 필요합니다.');
  }

  return userId;
};
