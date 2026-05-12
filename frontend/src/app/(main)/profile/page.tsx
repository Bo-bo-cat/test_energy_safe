'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

import { DecisionModal } from '../../../components/DecisionModal';
import { NameModal } from '../../../components/NameModal';
import { AlertModal } from '../../../components/AlertModal/AlertModal'; // Додали AlertModal
import { useTranslation } from '../../../context/LanguageContext';

export default function ProfilePage() {
  const router = useRouter();
  const { t, lang, toggleLanguage } = useTranslation();
  
  const [user, setUser] = useState<any>({ name: 'Користувач', email: '...' });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false); // Стейт для "Скоро буде!"

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : Promise.reject(t.profile.serverError))
        .then(data => { if (data) setUser(data); })
        .catch(err => console.error(t.profile.loadError, err));
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, [t.profile.serverError, t.profile.loadError]);

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
    <div className="global-page-wrap">
      <h1 className="page-title">{t.profile.title}</h1>

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
        
        <div className={styles.languageToggle} onClick={toggleLanguage}>
          <span>{lang === 'uk' ? 'Мова: Українська 🇺🇦' : 'Language: English 🇬🇧'}</span>
          <div className={styles.languageIndicator}>
             {lang === 'uk' ? 'UA' : 'EN'}
          </div>
        </div>

        <div className={styles.themeToggleMobile} onClick={toggleTheme}>
          <span>{t.sidebar.darkMode}</span>
          <div className={`${styles['toggle-switch']} ${isDarkMode ? styles.active : ''}`}>
            <div className={styles['toggle-knob']}></div>
          </div>
        </div>

        {/* ОНОВЛЕНО: Тепер при наведенні спрацює CSS, а при кліку викличе AlertModal */}
        <button 
          className={styles.changePasswordBtn} 
          onClick={() => setIsAlertOpen(true)}
          data-hover={t.deviceAdd.soon}
        >
          <span>{t.profile.changePassword}</span>
        </button>

        <button className={styles.faqBtn} onClick={() => router.push('/faq')}>
          FAQ
        </button>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          {t.profile.logout}
        </button>

        <button className={styles.deleteBtn} onClick={() => setShowDeleteModal(true)}>
          {t.profile.deleteAccount}
        </button>
      </div>

      <NameModal 
        isOpen={showNameModal} 
        onClose={() => setShowNameModal(false)} 
        onSave={handleChangeName} 
        initialName={user.name} 
      />

      {/* ОНОВЛЕНО: Модалка з повідомленням "Скоро буде" */}
      <AlertModal 
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={t.deviceAdd.soon}
      />

      <DecisionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title={t.common.areYouSure}
        confirmText={t.common.yes}
        cancelText={t.common.no}
      />
    </div>
  );
}