import React, { useState, useEffect } from 'react';
import styles from './SaveScenarioModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isLoading?: boolean;
  title?: string;        // Додали можливість змінити заголовок
  initialName?: string;  // Додали початкове значення для редагування
}

export const SaveScenarioModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  isLoading, 
  title = 'Додайте назву Сценарію', // Заголовок за замовчуванням
  initialName = '' 
}) => {
  const [name, setName] = useState('');

  // Коли модалка відкривається, підставляємо стару назву (якщо вона є)
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <input 
          type="text" 
          className={styles.input} 
          placeholder="Наприклад: Нічний режим" 
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
        />

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
};