'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { LightningIcon } from '../../components/icons/Lightning';
import { EyeIcon, EyeOffIcon } from '../../components/icons/eye';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  function switchMode(newMode: 'login' | 'register') {
    setMode(newMode);
    setError('');
    setEmail('');
    setName('');
    setPassword('');
    setShowPassword(false);
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
        setError('Невірний email або пароль');
        return;
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_name', data.user_name);
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
        setError('Користувач з таким email вже існує');
        return;
      }

      if (!res.ok) {
        setError('Помилка реєстрації. Спробуйте ще раз.');
        return;
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_name', data.user_name);
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
            Вхід
          </button>
          <button
            type="button"
            className={`${styles['mode-tab']} ${mode === 'register' ? styles['mode-tab-active'] : ''}`}
            onClick={() => switchMode('register')}
          >
            Реєстрація
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles['auth-form']}>

          <div className={styles['input-group']}>
            <label className={styles['input-label']}>Email</label>
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
              <label className={styles['input-label']}>Ім'я</label>
              <input
                type="text"
                className={styles['auth-input']}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Іван Іваненко"
              />
            </div>
          )}

          <div className={styles['input-group']}>
            <label className={styles['input-label']}>Пароль</label>
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
            {mode === 'login' ? 'Увійти' : 'Зареєструватися'}
          </button>

        </form>
      </div>

    </div>
  );
}
