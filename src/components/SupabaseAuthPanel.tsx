import { FormEvent, useState } from 'react';
import { getSupabaseClient } from '../supabase/client';

export default function SupabaseAuthPanel({ error }: { error?: string | null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(error ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (mode: 'sign-in' | 'sign-up') => {
    if (!email.trim() || !password) {
      setMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const supabase = getSupabaseClient();
      const result =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({ email: email.trim(), password });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (mode === 'sign-up' && !result.data.session) {
        setMessage('가입 확인 메일을 확인해주세요.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit('sign-in');
  };

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
          <div className="brand-mark">T</div>
          <div>
            <h1>Toodo</h1>
            <p>Cloud workspace</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className="auth-actions">
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              Sign in
            </button>
            <button type="button" className="small-button" disabled={isSubmitting} onClick={() => void submit('sign-up')}>
              Sign up
            </button>
          </div>

          <button type="button" className="google-button" disabled={isSubmitting} onClick={handleGoogleSignIn}>
            Continue with Google
          </button>

          {message ? <p className="auth-message">{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
