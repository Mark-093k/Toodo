import { useState } from 'react';
import toodoLogoUrl from '../assets/toodo-logo.png';
import { getSupabaseClient } from '../supabase/client';
import ThemeSwitcher from './ui/ThemeSwitcher';

export default function SupabaseAuthPanel({ error }: { error?: string | null }) {
  const [message, setMessage] = useState(error ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setMessage('');

    try {
      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setMessage(error.message);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-label="Supabase login">
        <div className="auth-brand">
          <div className="auth-brand-title">
            <div className="brand-mark">
              <img src={toodoLogoUrl} alt="" />
            </div>
            <div>
              <h1>Toodo</h1>
              <p>Cloud workspace</p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>

        <div className="auth-form">
          <button type="button" className="google-button" disabled={isSubmitting} onClick={handleGoogleSignIn}>
            <span className="google-mark">G</span>
            <span>{isSubmitting ? 'Opening Google...' : 'Continue with Google'}</span>
          </button>

          {message ? <p className="auth-message">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
