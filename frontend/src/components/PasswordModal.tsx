'use client';
import React, { useState } from 'react';
import styles from './PasswordModal.module.css';
import { EyeIcon, EyeOffIcon } from './icons/eye';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordModal({ isOpen, onClose }: PasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError('');
    if (newPassword.length < 4) {
      setError('Новий пароль має бути не менше 4 символів');
      return;
    }
    
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      
      if (res.status === 204) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setOldPassword('');
          setNewPassword('');
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.detail || 'Помилка зміни пароля');
      }
    } catch {
      setError('Помилка з\'єднання. Спробуйте ще раз');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Змінити пароль</h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.inputWrap}>
          <input
            type={showOld ? 'text' : 'password'}
            placeholder="Поточний пароль"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            className={styles.input}
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
            className={styles.input}
          />
          <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(v => !v)}>
            {showNew ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
          </button>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
        {success && <p className={styles.successMsg}>Пароль успішно змінено!</p>}

        <button 
          className={styles.submitBtn} 
          onClick={handleSubmit} 
          disabled={isLoading || success || !oldPassword || !newPassword}
        >
          {isLoading ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>
    </div>
  );
}