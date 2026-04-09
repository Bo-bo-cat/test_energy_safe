'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { LightningIcon } from '../../components/icons/lightning'; // Переконайся, що шлях правильний

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Змінили name на password
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ⚠️ Зверни увагу: я замінив name на password у запиті. 
    // Переконайся, що твій бекенд готовий приймати 'password'.
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password, 
        has_inverter: false,
        inverter_capacity_wh: null,
      }),
    });

    let user;

    if (res.status === 409) {
      const loginRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users?email=${encodeURIComponent(email)}`
      );
      if (!loginRes.ok) return;
      user = await loginRes.json();
    } else if (res.ok) {
      user = await res.json();
    } else {
      return;
    }

    if (!user.id) return;
    localStorage.setItem('user_id', user.id);
    // Якщо бекенд більше не повертає ім'я, цей рядок можна буде прибрати:
    if (user.name) localStorage.setItem('user_name', user.name); 
    router.push('/');
  }

  return (
    <div className={styles['page-container']}>
      
      <div className={styles['logo-container']}>
        <LightningIcon className={styles['logo-icon']} />
        <div className={styles['logo-text']}>Energy Safe</div>
      </div>

      <div className={styles['auth-card']}>
        <h1 className={styles['auth-head']}>Вхід</h1>
        
        <form onSubmit={handleSubmit} className={styles['auth-form']}>
          
          {/* Поле Email (тепер перше) */}
          <div className={styles['input-group']}>
            <label className={styles['input-label']}>email</label>
            <input 
              type="email" /* Додає базову перевірку браузера на наявність @ */
              className={styles['auth-input']}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="useruser@gmail.com" 
              required
            />
          </div>

          {/* Поле Пароль (тепер друге) */}
          <div className={styles['input-group']}>
            <label className={styles['input-label']}>Пароль</label>
            <input 
              type="password" /* Це перетворить текст на крапочки */
              className={styles['auth-input']}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="****************" 
              required
            />
          </div>

          <button type="submit" className={styles['submit-button']}>
            Увійти
          </button>
          
        </form>
      </div>

    </div>
  );
}