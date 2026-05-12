'use client';
import React, { useState } from 'react';
import styles from '../PasswordModal.module.css';
import { useTranslation } from '../../context/LanguageContext';

export function PasswordModal({ isOpen, onCloseAction }: { isOpen: boolean, onCloseAction: () => void }) {
  const { t } = useTranslation();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

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
        setTimeout(() => {
          onCloseAction();
          setSuccess(false);
          setOldPass(''); setNewPass('');
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Помилка');
      }
    } catch (err) {
      setError('Сервер недоступний');
    }
  };

  return (
    <div className={styles.overlay} onClick={onCloseAction}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t.profile.changePassword}</h2>
          <button className={styles.closeBtn} onClick={onCloseAction}>✕</button>
        </div>
        
        {success ? (
          <p className={styles.successMsg}>Пароль оновлено!</p>
        ) : (
          <>
            <div style={{display:'flex', flexDirection:'column', gap:'12px', marginBottom: '20px'}}>
              <input 
                type="password"
                className={styles.input}
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="Поточний пароль"
              />
              <input 
                type="password"
                className={styles.input}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Новий пароль"
              />
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