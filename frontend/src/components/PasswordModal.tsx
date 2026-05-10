// src/components/PasswordModal.tsx
'use client';
import React, { useState } from 'react';
import styles from './PasswordModal.module.css';
import { useTranslation } from '../context/LanguageContext';

export function PasswordModal({ isOpen, onCloseAction }: { isOpen: boolean, onCloseAction: () => void }) {
  const { t } = useTranslation();
  const [pass, setPass] = useState('');

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t.profile.changePassword}</h2>
          <button className={styles.closeBtn} onClick={onCloseAction}>✕</button>
        </div>
        
        <input 
          type="password"
          className={styles.input}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="****"
        />

        <button 
          className={styles.submitBtn}
          onClick={() => {/* логіка */}}
        >
          {t.common.save}
        </button>
      </div>
    </div>
  );
}