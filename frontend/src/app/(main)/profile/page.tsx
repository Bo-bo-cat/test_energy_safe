'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { DecisionModal } from '../../../components/DecisionModal';
import { EyeIcon, EyeOffIcon } from '../../../components/icons/eye';

// Плейсхолдер для користувача
const mockUser = {
  name: 'Користувач',
  email: 'user@energysafe.com'
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(mockUser);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Стейт для теми
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 1. Ініціалізація користувача
    const token = localStorage.getItem('access_token');

    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : Promise.reject('Помилка сервера'))
        .then(data => {
          if (data) setUser(data);
        })
        .catch(err => {
          console.error('Не вдалося завантажити профіль:', err);
        });
    }

    // 2. Ініціалізація теми (щоб тумблер показував правильний стан при завантаженні)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Функція перемикання теми
  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const avatarColor = useMemo(() => {
    const colors = ['#FF6B00', '#0029FF', '#00C2FF', '#FF2D55', '#5856D6', '#34C759', '#AF52DE', '#FF9500'];
    if (!user?.name) return colors[0];
    const charCode = user.name.charCodeAt(0);
    return colors[charCode % colors.length];
  }, [user?.name]);

  const openPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 4) {
      setPasswordError('Новий пароль має бути не менше 4 символів');
      return;
    }
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      if (res.status === 204) {
        setPasswordSuccess(true);
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        const data = await res.json();
        setPasswordError(data.detail || 'Помилка зміни пароля');
      }
    } catch {
      setPasswordError('Помилка з\'єднання. Спробуйте ще раз');
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      localStorage.clear();
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/auth';
    } catch {
      console.error('Помилка при видаленні');
      localStorage.clear();
      window.location.href = '/auth';
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/auth';
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Профіль</h1>

      <div className={styles.profileHeader}>
        <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.nameRow}>
            <h2 className={styles.userName}>{user.name}</h2>
            {/* Іконка редагування */}
            <svg className={styles.editIcon} viewBox="0 0 24 24" fill="currentColor" width="24">
              <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" />
            </svg>
          </div>
          <p className={styles.userEmail}>{user.email}</p>
        </div>
      </div>

      <div className={styles.controlsRow}>
        
        {/* Мобільний перемикач теми (видно тільки на <768px) */}
        <div className={styles.themeToggleMobile} onClick={toggleTheme}>
          <span>Темна тема</span>
          <div className={`${styles['toggle-switch']} ${isDarkMode ? styles.active : ''}`}>
            <div className={styles['toggle-knob']}></div>
          </div>
        </div>

        <button className={styles.changePasswordBtn} onClick={openPasswordModal}>
          Змінити пароль
        </button>

        <button className={styles.faqBtn} onClick={() => router.push('/faq')}>
          FAQ
        </button>

        <button
          className={styles.deleteBtn}
          onClick={() => setShowDeleteModal(true)}
        >
          Видалити аккаунт
        </button>

        {/* Мобільна кнопка виходу */}
        <button 
          className={styles.logoutBtn} 
          onClick={handleLogout}
        >
          Вийти з акаунту
        </button>
        
      </div>

      <DecisionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />

      {showPasswordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.passwordModal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Змінити пароль</h2>

            <div className={styles.inputWrap}>
              <input
                type={showOld ? 'text' : 'password'}
                placeholder="Поточний пароль"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className={styles.passwordInput}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowOld(v => !v)}>
                {showOld ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
              </button>
            </div>

            <div className={styles.inputWrap}>
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Новий пароль"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={styles.passwordInput}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(v => !v)}>
                {showNew ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
              </button>
            </div>

            {passwordError && <p className={styles.errorMsg}>{passwordError}</p>}
            {passwordSuccess && <p className={styles.successMsg}>Пароль змінено</p>}

            <div className={styles.modalButtons}>
              <button className={styles.confirmBtn} onClick={handleChangePassword}>Зберегти</button>
              <button className={styles.cancelBtn} onClick={() => setShowPasswordModal(false)}>Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}