'use client';
import { useEffect, useState, useMemo, FormEvent } from 'react';
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
  
  const [user, setUser] = useState<any>({ name: '', email: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  const [isMobileSupportOpen, setIsMobileSupportOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // === Стейт для форми зворотного зв'язку ===
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUser(data); })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
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
        alert((t.profile as any)?.serverError || 'Помилка при видаленні акаунту');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    const token = localStorage.getItem('access_token');

    try {
      const formData = new FormData();
      formData.append('message', feedbackText);
      formData.append('email', user.email); // Передаємо email юзера для зворотного зв'язку

      // Відправка на бекенд (бекенд вже має відправити це на energyappsf@gmail.com)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback/`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      setSubmitSuccess(true);
      setFeedbackText('');

      setTimeout(() => {
        setSubmitSuccess(false);
        setIsMobileSupportOpen(false);
      }, 3000);

    } catch (err: any) {
      console.error('Помилка відправки форми:', err);
      setSubmitError(err.message || 'Unknown error');
      setTimeout(() => setSubmitError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarColor = useMemo(() => {
    if (!user.name) return '#FF6B00';
    const charCodeSum = user.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[charCodeSum % AVATAR_COLORS.length];
  }, [user.name]);

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{(t.profile as any)?.title || 'Профіль'}</h1>

      {isLoading ? (
        <p style={{ color: 'var(--text-main)', fontWeight: 500, padding: '24px 0' }}>
          {lang === 'uk' ? 'Завантаження...' : 'Loading...'}
        </p>
      ) : (
        <div className={styles.profileLayout}>
          
          {/* ЛІВА КОЛОНКА */}
          <div className={styles.leftColumn}>
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
                <span>{lang === 'uk' ? 'Мова: Українська' : 'Language: English'}</span>
                <div className={styles.languageIndicator}>{lang === 'uk' ? 'UA' : 'EN'}</div>
              </div>

              <div className={styles.themeToggleMobile} onClick={toggleTheme}>
                <span>{(t.sidebar as any)?.darkMode || 'Темна тема'}</span>
                <div className={`${styles['toggle-switch']} ${isDarkMode ? styles.active : ''}`}>
                  <div className={styles['toggle-knob']}></div>
                </div>
              </div>

              <button className={styles.changePasswordBtn} onClick={() => setShowPassModal(true)}>
                {(t.profile as any)?.changePassword || 'Змінити пароль'}
              </button>

              <button className={styles.faqBtn} onClick={() => router.push('/faq')}>
                {lang === 'uk' ? 'Відповіді на часті запитання (FAQ)' : 'Frequently Asked Questions (FAQ)'}
              </button>

              <button className={styles.supportBtn} onClick={() => setShowSupportModal(true)}>
                {lang === 'uk' ? '❤️ Підтримати нас' : '❤️ Support Us'}
              </button>

              <button className={styles.supportBtnMobile} onClick={() => setIsMobileSupportOpen(true)}>
                {lang === 'uk' ? 'Служба підтримки' : 'Support Team'}
              </button>

              <div className={styles.dangerZone}>
                <button className={styles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
                  {(t.profile as any)?.logout || 'Вийти'}
                </button>
                <button className={styles.deleteBtn} onClick={() => setShowDeleteModal(true)}>
                  {(t.profile as any)?.deleteAccount || 'Видалити аккаунт'}
                </button>
              </div>
            </div>
          </div>

          {/* ПРАВА КОЛОНКА */}
          <div className={`${styles.rightColumn} ${isMobileSupportOpen ? styles.mobileOpen : ''}`}>
            <div className={styles.mobileBackdrop} onClick={() => setIsMobileSupportOpen(false)}></div>
            
            <div className={styles.contactBlock}>
              <div className={styles.contactHeader}>
                <h2 className={styles.contactTitle}>
                  {lang === 'uk' ? 'Служба підтримки' : 'Support Team'}
                </h2>
                <button className={styles.closeSupportBtn} onClick={() => setIsMobileSupportOpen(false)}>
                  &times;
                </button>
              </div>
              
              <p className={styles.contactDesc}>
                {lang === 'uk' 
                  ? 'Знайшли баг, маєте ідею щодо покращення або питання до розробників? Напишіть нам, і ми відповімо вам на email.' 
                  : 'Found a bug or have a suggestion? Write to us and we will reply to your email.'}
              </p>

              {submitSuccess ? (
                <div className={styles.successMsg}>
                  {lang === 'uk' ? 'Повідомлення надіслано розробникам! Дякуємо.' : 'Message sent to developers! Thank you.'}
                </div>
              ) : (
                <form className={styles.form} onSubmit={handleFeedbackSubmit}>
                  <textarea
                    className={styles.textarea}
                    placeholder={lang === 'uk' ? 'Опишіть ваше питання або проблему...' : 'Describe your question or issue...'}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    required
                  />
                  
                  <button 
                    type="submit" 
                    className={styles.submitBtn} 
                    disabled={isSubmitting || !feedbackText.trim()}
                  >
                    {isSubmitting 
                      ? (lang === 'uk' ? 'Відправка...' : 'Sending...') 
                      : (lang === 'uk' ? 'Надіслати повідомлення' : 'Send message')}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      )}

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
        title={((t.profile as any)?.logout || 'Вийти') + "?"}
        confirmText={(t.common as any)?.yes || 'Так'}
        cancelText={(t.common as any)?.no || 'Ні'}
      />

      <DecisionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title={(t.common as any)?.areYouSure || 'Ви впевнені?'}
        confirmText={(t.common as any)?.delete || 'Видалити'}
        cancelText={(t.common as any)?.no || 'Ні'}
      />

      {showSupportModal && (
        <div className={styles.supportOverlay} onClick={() => setShowSupportModal(false)}>
          <div className={styles.supportModal} onClick={e => e.stopPropagation()}>
            <button className={styles.supportModalClose} onClick={() => setShowSupportModal(false)}>✕</button>
            <p className={styles.supportModalTitle}>
              {lang === 'uk' ? '❤️ Підтримати нас' : '❤️ Support Us'}
            </p>
            <p className={styles.supportModalDesc}>
              {lang === 'uk'
                ? 'Скануй QR-код або натисни кнопку, щоб підтримати розвиток Energy Safe через Monobank'
                : 'Scan the QR code or tap the button to support Energy Safe via Monobank'}
            </p>
            <div className={styles.qrWrap}>
              <img
                src={`https://chart.googleapis.com/chart?chs=180x180&cht=qr&chl=https%3A%2F%2Fsend.monobank.ua%2Fjar%2F4NtaqVTLTB&choe=UTF-8`}
                alt="QR Monobank"
              />
            </div>
            <a
              href="https://send.monobank.ua/jar/4NtaqVTLTB"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.supportModalLink}
              onClick={() => setShowSupportModal(false)}
            >
              {lang === 'uk' ? 'Відкрити банку' : 'Open donation link'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}