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
        <h3 className={styles.modalHeader}>Додати систему вручну</h3>
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
            <button type="button" className={styles.modalBtnCancel} onClick={onClose}>
              {t.common.no || 'Скасувати'}
            </button>
            <button type="submit" className={styles.modalBtnSave}>
              Зберегти
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};