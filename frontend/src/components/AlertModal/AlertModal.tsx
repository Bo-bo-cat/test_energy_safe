// src/components/AlertModal/AlertModal.tsx
'use client';
import React, { useEffect } from 'react';
import styles from './AlertModal.module.css';
import { useTranslation } from '../../context/LanguageContext';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string | React.ReactNode;
  buttonText?: string;
  autoClose?: boolean;
  duration?: number; // Додано: можливість керувати часом
  isAccent?: boolean; // Додано: акцентний колір
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText,
  autoClose = true,
  duration = 2500, // Змінено дефолтний час з 1000 на 2500 (2.5 сек)
  isAccent = false // За замовчуванням вимкнено
}: AlertModalProps) {
  const { t } = useTranslation();
  
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration); 
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose, duration]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && (
          <h3 className={`${styles.title} ${isAccent ? styles.titleAccent : ''}`}>
            {title}
          </h3>
        )}
        {message && <div className={styles.message}>{message}</div>}
        
        {!autoClose && (
          <button className={styles.btn} onClick={onClose}>
            {buttonText || t.common.gotIt}
          </button>
        )}
      </div>
    </div>
  );
}