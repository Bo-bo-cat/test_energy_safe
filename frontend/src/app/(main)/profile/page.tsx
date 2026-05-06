'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

import { DecisionModal } from '../../../components/DecisionModal';
import { PasswordModal } from '../../../components/PasswordModal';
import { NameModal } from '../../../components/NameModal';

const mockUser = { name: 'Користувач', email: 'user@energysafe.com' };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(mockUser);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Стейти модалок
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : Promise.reject('Помилка сервера'))
        .then(data => { if (data) setUser(data); })
        .catch(err => console.error('Не вдалося завантажити профіль:', err));
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

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

  const handleChangeName = async (newName: string) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        setUser((prev: any) => ({ ...prev, name: newName }));
        setShowNameModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      handleLogout();
    } catch {
      handleLogout();
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
            <svg className={styles.editIcon} onClick={() => setShowNameModal(true)} viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" />
            </svg>
          </div>
          <p className={styles.userEmail}>{user.email}</p>
        </div>
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.themeToggleMobile} onClick={toggleTheme}>
          <span>Темна тема</span>
          <div className={`${styles['toggle-switch']} ${isDarkMode ? styles.active : ''}`}>
            <div className={styles['toggle-knob']}></div>
          </div>
        </div>

        <button className={styles.changePasswordBtn} onClick={() => setShowPasswordModal(true)}>
          Змінити пароль
        </button>

        <button className={styles.faqBtn} onClick={() => router.push('/faq')}>
          FAQ
        </button>

        <button className={styles.deleteBtn} onClick={() => setShowDeleteModal(true)}>
          Видалити аккаунт
        </button>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Вийти з акаунту
        </button>
      </div>

      {/* Модалки */}
      <NameModal 
        isOpen={showNameModal} 
        onClose={() => setShowNameModal(false)} 
        onSave={handleChangeName} 
        initialName={user.name} 
      />

      <PasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />

      <DecisionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}