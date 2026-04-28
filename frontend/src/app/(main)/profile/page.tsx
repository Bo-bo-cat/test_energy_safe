'use client';
import { useEffect, useState, useMemo } from 'react';
import styles from './page.module.css';
import { DecisionModal } from '../../../components/DecisionModal';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    
    if (!userId || !token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data) setUser(data);
      })
      .catch(err => console.error('Помилка завантаження профілю:', err));
  }, []);

  // Колір аватара (стабільний для імені)
  const avatarColor = useMemo(() => {
    const colors = ['#FF6B00', '#0029FF', '#00C2FF', '#FF2D55', '#5856D6', '#34C759', '#AF52DE', '#FF9500'];
    if (!user?.name) return colors[0];
    const charCode = user.name.charCodeAt(0);
    return colors[charCode % colors.length];
  }, [user?.name]);

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Очищення даних
      localStorage.clear();
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/auth';
    } catch (err) {
      console.error('Помилка при видаленні');
      localStorage.clear();
      window.location.href = '/auth';
    }
  };

  if (!user) return <div className={styles.wrap}><h1 className={styles.title}>Профіль</h1><p>Завантаження...</p></div>;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Профіль</h1>

      <div className={styles.profileHeader}>
        <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
          {user.name?.charAt(0).toUpperCase()}
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
        <div className={styles.themeBox}>
          <span className={styles.themeLabel}>Темна тема</span>
          <div 
            className={`${styles.toggleSwitch} ${isDarkMode ? styles.active : ''}`}
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            <div className={styles.toggleKnob}></div>
          </div>
        </div>

        <button 
          className={styles.deleteBtn}
          onClick={() => setShowDeleteModal(true)}
        >
          Видалити аккаунт
        </button>
      </div>

      {/* НОВА МОДАЛКА (без поля text) */}
      <DecisionModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}