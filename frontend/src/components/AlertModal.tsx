'use client';

import React, { useEffect } from 'react';
import styles from './AlertModal.module.css';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string | React.ReactNode;
  buttonText?: string;
  isError?: boolean; // Якщо true - заголовок буде помаранчевим/акцентним (можна адаптувати під червоний)
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  title = 'Увага', 
  message, 
  buttonText = 'Зрозуміло',
  isError = false
}: AlertModalProps) {
  
  // Блокуємо скролл сторінки, коли модалка відкрита
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay} 
      onClick={onClose} // Закриває модалку при кліку на темний фон
    >
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()} // Запобігає закриттю при кліку на саму модалку
      >
        <h3 className={`${styles.title} ${isError ? styles.titleAccent : ''}`}>
          {title}
        </h3>
        
        <div className={styles.message}>
          {message}
        </div>
        
        <button className={styles.btn} onClick={onClose}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}