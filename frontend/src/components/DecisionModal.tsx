// src/components/DecisionModal/DecisionModal.tsx
import React from 'react';
import styles from './DecisionModal.module.css';

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
  title = 'Ви впевнені?',
  confirmText = 'Так',
  cancelText = 'Ні'
}: DecisionModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        <h2 className={styles.title}>{title}</h2>
        
        <div className={styles.buttons}>
          {/* Згідно з SVG: "Так" зліва, "Ні" справа */}
          <button className={styles.btn} onClick={onConfirm}>
            {confirmText}
          </button>
          <button className={styles.btn} onClick={onClose}>
            {cancelText}
          </button>
        </div>

      </div>
    </div>
  );
}