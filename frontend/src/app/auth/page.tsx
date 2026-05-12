'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { LightningIcon } from '../../components/icons/Lightning';
import { EyeIcon, EyeOffIcon } from '../../components/icons/eye';
import { LanguageProvider, useTranslation } from '../../context/LanguageContext';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function AuthPageContent() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const urlError = params.get('error');
    if (urlError) {
      setError(
        urlError === 'google_denied'
          ? t.auth.googleDenied
          : t.auth.googleError
      );
    }
  }, [params, t.auth.googleDenied, t.auth.googleError]);

  function switchMode(newMode: 'login' | 'register') {
    setMode(newMode);
    setError('');
    setEmail('');
    setName('');
    setPassword('');
    setShowPassword(false);
  }

  function handleGoogleLogin() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError(t.auth.invalidCreds);
        return;
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_name', data.user_name);
      document.cookie = `access_token=${data.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      router.push('/');
    } else {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name.trim() || email.split('@')[0],
          password,
          has_inverter: false,
          inverter_capacity_wh: null,
        }),
      });

      if (res.status === 409) {
        setError(t.auth.userExists);
        return;
      }

      if (!res.ok) {
        setError(t.auth.regError);
        return;
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_name', data.user_name);
      document.cookie = `access_token=${data.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      router.push('/');
    }
  }

  return (
    <div className={styles['page-container']}>

      <div className={styles['logo-container']}>
        <LightningIcon className={styles['logo-icon']} />
        <div className={styles['logo-text']}>Energy Safe</div>
      </div>

      <div className={styles['auth-card']}>
        <div className={styles['mode-tabs']}>
          <button
            type="button"
            className={`${styles['mode-tab']} ${mode === 'login' ? styles['mode-tab-active'] : ''}`}
            onClick={() => switchMode('login')}
          >
            {t.auth.loginTab}
          </button>
          <button
            type="button"
            className={`${styles['mode-tab']} ${mode === 'register' ? styles['mode-tab-active'] : ''}`}
            onClick={() => switchMode('register')}
          >
            {t.auth.registerTab}
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles['auth-form']}>

          <div className={styles['input-group']}>
            <label className={styles['input-label']}>{t.auth.email}</label>
            <input
              type="email"
              className={styles['auth-input']}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="useruser@gmail.com"
              required
            />
          </div>

          {mode === 'register' && (
            <div className={styles['input-group']}>
              <label className={styles['input-label']}>{t.auth.name}</label>
              <input
                type="text"
                className={styles['auth-input']}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.auth.namePlaceholder}
              />
            </div>
          )}

          <div className={styles['input-group']}>
            <label className={styles['input-label']}>{t.auth.password}</label>
            <div className={styles['password-wrapper']}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${styles['auth-input']} ${styles['password-input']}`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="****************"
                required
              />
              <button
                type="button"
                className={styles['eye-button']}
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOffIcon className={styles['eye-icon']} />
                  : <EyeIcon className={styles['eye-icon']} />
                }
              </button>
            </div>
          </div>

          {error && <p className={styles['error-text']}>{error}</p>}

          <button type="submit" className={styles['submit-button']}>
            {mode === 'login' ? t.auth.loginBtn : t.auth.registerBtn}
          </button>

          {/* Перемістили Google кнопку сюди */}
          <div className={styles['divider']}>
            <span className={styles['divider-text']}>{t.auth.orDivider}</span>
          </div>

          <button type="button" className={styles['google-button']} onClick={handleGoogleLogin}>
            <GoogleIcon />
            {t.auth.continueWithGoogle}
          </button>

        </form>
      </div>

    </div>
  );
}

function AuthPageWithParams() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  );
}

export default function AuthPage() {
  return (
    <LanguageProvider>
      <AuthPageWithParams />
    </LanguageProvider>
  );
}