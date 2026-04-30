'use client';
import { useEffect, useState, useMemo } from 'react';
import styles from './page.module.css';
import { DecisionModal } from '../../../components/DecisionModal';

export default function ProfilePage() {
  // Початковий стейт для користувача тепер null (без фейкових даних)
  const [user, setUser] = useState<any>(null);
  // Додаємо стейт завантаження
  const [isLoading, setIsLoading] = useState(true);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 1. Ініціалізація користувача
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    
    if (userId && token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : Promise.reject('Помилка сервера'))
        .then(data => {
          if (data) setUser(data);
        })
        .catch(err => {
          console.error('Не вдалося завантажити профіль:', err);
        })
        .finally(() => {
          // Вимикаємо завантаження, коли запит завершився (успішно чи з помилкою)
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    // 2. Ініціалізація теми
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

  // Колір аватара
  const avatarColor = useMemo(() => {
    // Якщо йде завантаження або немає імені, показуємо нейтральний сірий фон
    if (!user?.name) return 'var(--border-color)'; 
    
    const colors = ['#FF6B00', '#0029FF', '#00C2FF', '#FF2D55', '#5856D6', '#34C759', '#AF52DE', '#FF9500'];
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
      
      localStorage.clear();
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/auth';
    } catch (err) {
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
        {/* Аватарка: якщо вантажиться, показуємо порожній кружок, інакше першу літеру імені */}
        <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
          {isLoading ? '' : (user?.name?.charAt(0).toUpperCase() || 'U')}
        </div>
        
        <div className={styles.userInfo}>
          <div className={styles.nameRow}>
            {/* Текст завантаження замість фейкового імені */}
            <h2 className={styles.userName}>
              {isLoading ? 'Завантаження...' : (user?.name || 'Користувач')}
            </h2>
            {!isLoading && (
              <svg className={styles.editIcon} viewBox="0 0 24 24" fill="currentColor" width="24">
                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" />
              </svg>
            )}
          </div>
          {/* Текст завантаження замість фейкової пошти */}
          <p className={styles.userEmail}>
            {isLoading ? 'Отримання даних...' : (user?.email || '')}
          </p>
        </div>
      </div>

      <div className={styles.controlsRow}>
        
        {/* Мобільний перемикач теми */}
        <div className={styles.themeToggleMobile} onClick={toggleTheme}>
          <span>Темна тема</span>
          <div className={`${styles['toggle-switch']} ${isDarkMode ? styles.active : ''}`}>
            <div className={styles['toggle-knob']}></div>
          </div>
        </div>

        <button 
          className={styles.deleteBtn}
          onClick={() => setShowDeleteModal(true)}
          disabled={isLoading} // Вимикаємо кнопку видалення, поки йде завантаження
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
    </div>
  );
}