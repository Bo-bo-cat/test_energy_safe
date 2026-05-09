// src/components/AlertModal/AlertModal.tsx
'use client';
import React, { useEffect } from 'react';
import styles from './AlertModal.module.css';
import { useTranslation } from '../context/LanguageContext';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string | React.ReactNode;
  buttonText?: string;
  autoClose?: boolean;
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText,
  autoClose = true
}: AlertModalProps) {
  const { t } = useTranslation();
  
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {message && <div className={styles.message}>{message}</div>}
        
        {/* Кнопка закриття, якщо автозакриття вимкнено */}
        {!autoClose && (
          <button className={styles.btn} onClick={onClose}>
            {buttonText || t.common.gotIt}
          </button>
        )}
      </div>
    </div>
  );
}