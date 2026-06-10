'use client';
import React, { useState } from 'react';
import styles from './PasswordModal.module.css';
import { useTranslation } from '../../context/LanguageContext';
import { EyeIcon, EyeOffIcon } from '../icons/eye';

export function PasswordModal({ isOpen, onCloseAction }: { isOpen: boolean, onCloseAction: () => void }) {
  const { t, lang } = useTranslation();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [googleAccount, setGoogleAccount] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setOldPass(''); setNewPass('');
    setShowOld(false); setShowNew(false);
    setError(''); setSuccess(false); setGoogleAccount(false);
    onCloseAction();
  };

  const handleSave = async () => {
    setError('');
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { handleClose(); }, 2000);
      } else {
        const data = await res.json();
        if (data.detail === 'Акаунт Google') {
          setGoogleAccount(true);
        } else {
          setError(data.detail || 'Помилка');
        }
      }
    } catch (err) {
      setError('Сервер недоступний');
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t.profile.changePassword}</h2>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        {success ? (
          <p className={styles.successMsg}>{lang === 'uk' ? 'Пароль оновлено!' : 'Password updated!'}</p>
        ) : googleAccount ? (
          <p className={styles.errorMsg}>
            {lang === 'uk'
              ? 'Зміна паролю недоступна для цього типу акаунту.'
              : 'Password change is not available for this account type.'}
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div className={styles.inputWrap}>
                <input
                  type={showOld ? 'text' : 'password'}
                  className={styles.input}
                  value={oldPass}
                  onChange={e => setOldPass(e.target.value)}
                  placeholder={lang === 'uk' ? 'Поточний пароль' : 'Current password'}
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowOld(v => !v)}>
                  {showOld ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
                </button>
              </div>
              <div className={styles.inputWrap}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className={styles.input}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder={lang === 'uk' ? 'Новий пароль' : 'New password'}
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
                </button>
              </div>
            </div>
            {error && <p className={styles.errorMsg}>{error}</p>}
            <button className={styles.submitBtn} onClick={handleSave}>
              {t.common.save}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
