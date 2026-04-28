'use client';
import styles from './DecisionModal.module.css';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
}

export function DecisionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  text,
  confirmText = "Видалити",
  cancelText = "Скасувати"
}: DecisionModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onClose}>
            {cancelText}
          </button>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}