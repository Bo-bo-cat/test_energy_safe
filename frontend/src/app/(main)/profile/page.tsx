'use client';
import { useEffect, useState, useMemo } from 'react';
import styles from './page.module.css';

import { DecisionModal } from '../../../components/DecisionModal/DecisionModal';
import { NameModal } from '../../../components/PasswordModal/NameModal';
import { PasswordModal } from '../../../components/PasswordModal/PasswordModal'; // Справжня модалка
import { useTranslation } from '../../../context/LanguageContext';

export default function ProfilePage() {
  const { t, lang, toggleLanguage } = useTranslation();
  
  const [user, setUser] = useState<any>({ name: '...', email: '...' });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Для виходу
  const [showNameModal, setShowNameModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false); // Для пароля

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

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{t.profile.title}</h1>

      <div className={styles.profileHeader}>
        <div className={styles.avatar} style={{ backgroundColor: '#FF6B00' }}>
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
          <span>{t.sidebar.darkMode}</span>
          <div className={`${styles['toggle-switch']} ${isDarkMode ? styles.active : ''}`}>
            <div className={styles['toggle-knob']}></div>
          </div>
        </div>

        <button className={styles.changePasswordBtn} onClick={() => setShowPassModal(true)}>
          <span>{t.profile.changePassword}</span>
        </button>

        <button className={styles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
          {t.profile.logout}
        </button>

        <button className={styles.deleteBtn} onClick={() => setShowDeleteModal(true)}>
          {t.profile.deleteAccount}
        </button>
      </div>

      {/* МОДАЛКИ */}
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
        title={t.profile.logout + "?"}
        confirmText={t.common.yes}
        cancelText={t.common.no}
      />

      <DecisionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {/* логіка видалення */}}
        title={t.common.areYouSure}
      />
    </div>
  );
}