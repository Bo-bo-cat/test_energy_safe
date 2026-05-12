import React, { useState } from 'react';
import styles from './AddSystemModal.module.css';
import { useTranslation } from '../../context/LanguageContext';

interface AddSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { model: string; power: string; battery: string; autonomy: string }) => Promise<void>;
}

export const AddSystemModal: React.FC<AddSystemModalProps> = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  
  const [customForm, setCustomForm] = useState({
    model: '',
    power: '',
    battery: '',
    autonomy: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(customForm);
    // Очищаємо форму після успішного збереження
    setCustomForm({ model: '', power: '', battery: '', autonomy: '' });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        
        {/* ОНОВЛЕНИЙ ХЕДЕР З ХРЕСТИКОМ */}
        <div className={styles.header}>
          <h3 className={styles.modalHeader}>Додати систему вручну</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          
          <div className={styles.inputWrap}>
            <label>Назва моделі</label>
            <input 
              required 
              placeholder="Напр. Моя збірка 12V" 
              value={customForm.model} 
              onChange={e => setCustomForm({...customForm, model: e.target.value})} 
            />
          </div>

          <div className={styles.inputWrap}>
            <label>Потужність (Вт)</label>
            <input 
              required 
              type="number" 
              min="1" 
              placeholder="Напр. 1000" 
              value={customForm.power} 
              onChange={e => setCustomForm({...customForm, power: e.target.value})} 
            />
          </div>

          <div className={styles.inputWrap}>
            <label>Ємність батареї</label>
            <input 
              required 
              placeholder="Напр. 100Ah або 1200Wh" 
              value={customForm.battery} 
              onChange={e => setCustomForm({...customForm, battery: e.target.value})} 
            />
          </div>

          <div className={styles.inputWrap}>
            <label>Приблизна автономія</label>
            <input 
              required 
              placeholder="Напр. 4-6 год" 
              value={customForm.autonomy} 
              onChange={e => setCustomForm({...customForm, autonomy: e.target.value})} 
            />
          </div>

          <div className={styles.modalActions}>
            {/* Кнопку "Ні" видалено, кнопка "Зберегти" тепер на всю ширину */}
            <button type="submit" className={styles.modalBtnSave}>
              Зберегти
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};