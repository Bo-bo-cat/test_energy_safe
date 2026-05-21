'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

import { DecisionModal } from '../../../components/DecisionModal/DecisionModal';
import { NameModal } from '../../../components/PasswordModal/NameModal';
import { PasswordModal } from '../../../components/PasswordModal/PasswordModal';
import { useTranslation } from '../../../context/LanguageContext';

const AVATAR_COLORS = [
  '#FF6B00', '#4CAF50', '#2196F3', '#9C27B0', 
  '#E91E63', '#00BCD4', '#8BC34A', '#FF9800',
  '#3F51B5', '#795548'
];

export default function ProfilePage() {
  const { t, lang, toggleLanguage } = useTranslation();
  const router = useRouter();
  
  const [user, setUser] = useState<any>({ name: '...', email: '...' });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUser(data); });
    }
    if (localStorage.getItem('theme') === 'dark') setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleChangeName = async (newName: string) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName })
    });
    if (res.ok) {
      setUser((prev: any) => ({ ...prev, name: newName }));
      setShowNameModal(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/auth';
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        localStorage.clear();
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/auth';
      } else {
        alert(t.profile?.serverError || 'Помилка при видаленні акаунту');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const avatarColor = useMemo(() => {
    if (!user.name || user.name === '...') return '#FF6B00';
    const charCodeSum = user.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[charCodeSum % AVATAR_COLORS.length];
  }, [user.name]);

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{t.profile?.title || 'Профіль'}</h1>

      <div className={styles.profileHeader}>
        <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
          {user.name?.charAt(0).toUpperCase()}
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
        <div className={styles.languageToggle} onClick={toggleLanguage}>
          <span>{lang === 'uk' ? 'Мова: Українська 🇺🇦' : 'Language: English 🇬🇧'}</span>
          <div className={styles.languageIndicator}>{lang === 'uk' ? 'UA' : 'EN'}</div>
        </div>

        <div className={styles.themeToggleMobile} onClick={toggleTheme}>
          <span>{t.sidebar?.darkMode || 'Темна тема'}</span>
          <div className={`${styles['toggle-switch']} ${isDarkMode ? styles.active : ''}`}>
            <div className={styles['toggle-knob']}></div>
          </div>
        </div>

        <button 
          className={styles.changePasswordBtn} 
          onClick={() => setShowPassModal(true)}
        >
          {t.profile?.changePassword || 'Змінити пароль'}
        </button>

        <button 
          className={styles.faqBtn} 
          onClick={() => router.push('/faq')}
        >
          FAQ
        </button>

        <button className={styles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
          {t.profile?.logout || 'Вийти'}
        </button>

        <button className={styles.deleteBtn} onClick={() => setShowDeleteModal(true)}>
          {t.profile?.deleteAccount || 'Видалити аккаунт'}
        </button>
      </div>

      <NameModal 
        isOpen={showNameModal} 
        onClose={() => setShowNameModal(false)} 
        onSave={handleChangeName} 
        initialName={user.name} 
      />

      <PasswordModal 
        isOpen={showPassModal} 
        onCloseAction={() => setShowPassModal(false)} 
      />

      <DecisionModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title={(t.profile?.logout || 'Вийти') + "?"}
        confirmText={t.common?.yes || 'Так'}
        cancelText={t.common?.no || 'Ні'}
      />

      <DecisionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title={t.common?.areYouSure || 'Ви впевнені?'}
        confirmText={t.common?.delete || 'Видалити'}
        cancelText={t.common?.no || 'Ні'}
      />
    </div>
  );
}