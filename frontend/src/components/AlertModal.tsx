'use client';

import React from 'react';
import styles from './AlertModal.module.css';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string | React.ReactNode; // Зробили повідомлення необов'язковим
  buttonText?: string;
  isError?: boolean;
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = 'Зрозуміло',
  isError = false
}: AlertModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
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
        
        <button className={styles.btn} onClick={onClose}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}