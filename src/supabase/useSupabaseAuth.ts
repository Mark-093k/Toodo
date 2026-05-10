import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './client';

type SupabaseAuthState = {
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
  error: string | null;
};

export const useSupabaseAuth = (): SupabaseAuthState => {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<SupabaseAuthState>({
    isConfigured: configured,
    isLoading: configured,
    session: null,
    error: null,
  });

  useEffect(() => {
    if (!configured) {
      setState({ isConfigured: false, isLoading: false, session: null, error: null });
      return undefined;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        setState({
          isConfigured: true,
          isLoading: false,
          session: data.session,
          error: error?.message ?? null,
        });
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setState({
          isConfigured: true,
          isLoading: false,
          session: null,
          error: error instanceof Error ? error.message : 'Supabase 세션을 확인하지 못했습니다.',
        });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ isConfigured: true, isLoading: false, session, error: null });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  return state;
};
