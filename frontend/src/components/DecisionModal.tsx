// src/components/DecisionModal/DecisionModal.tsx
'use client';
import React from 'react';
import styles from './DecisionModal.module.css';
import { useTranslation } from '../context/LanguageContext';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

export function DecisionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText,
  cancelText
}: DecisionModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        <h2 className={styles.title}>{title || t.common.areYouSure}</h2>
        
        <div className={styles.buttons}>
          <button className={styles.btn} onClick={onConfirm}>
            {confirmText || t.common.yes}
          </button>
          <button className={styles.btn} onClick={onClose}>
            {cancelText || t.common.no}
          </button>
        </div>

      </div>
    </div>
  );
}