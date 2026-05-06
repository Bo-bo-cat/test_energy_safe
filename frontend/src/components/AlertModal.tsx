'use client';

import React, { useEffect } from 'react';
import styles from './AlertModal.module.css';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string | React.ReactNode;
  buttonText?: string;
  isError?: boolean;
  showButton?: boolean; // Додаємо можливість керувати кнопкою
  autoClose?: boolean;  // Чи закривати автоматично
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = 'Зрозуміло',
  isError = false,
  showButton = false, // За замовчуванням приховуємо кнопку
  autoClose = true    // За замовчуванням закриваємо автоматично
}: AlertModalProps) {
  
  // Автоматичне закриття через 3 секунди
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && (
          <h3 className={`${styles.title} ${isError ? styles.titleAccent : ''}`}>
            {title}
          </h3>
        )}
        
        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}
        
        {/* Показуємо кнопку тільки якщо showButton === true */}
        {showButton && (
          <button className={styles.btn} onClick={onClose}>
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}