'use client';
import React, { useState, useEffect } from 'react';
import styles from './PasswordModal.module.css'; // Перевикористовуємо стилі модалки!

interface NameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  initialName: string;
}

export function NameModal({ isOpen, onClose, onSave, initialName }: NameModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    await onSave(name.trim());
    setIsLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Змінити ім'я</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.inputWrap}>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="Наприклад: Микита" 
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        <button 
          className={styles.submitBtn} 
          onClick={handleSave}
          disabled={!name.trim() || isLoading}
        >
          {isLoading ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>
    </div>
  );
}