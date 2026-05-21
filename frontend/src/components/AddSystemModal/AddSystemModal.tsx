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
    setCustomForm({ model: '', power: '', battery: '', autonomy: '' });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        
        <div className={styles.header}>
          <h3 className={styles.modalHeader}>{t.picker.modalTitle}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          
          <div className={styles.inputWrap}>
            <label>{t.picker.modelName}</label>
            <input 
              required 
              placeholder={t.picker.modelPlaceholder} 
              value={customForm.model} 
              onChange={e => setCustomForm({...customForm, model: e.target.value})} 
            />
          </div>

          <div className={styles.inputWrap}>
            <label>{t.picker.powerLabel}</label>
            <input 
              required 
              type="number" 
              min="1" 
              placeholder={t.picker.powerPlaceholder} 
              value={customForm.power} 
              onChange={e => setCustomForm({...customForm, power: e.target.value})} 
            />
          </div>

          <div className={styles.inputWrap}>
            <label>{t.picker.batteryLabel}</label>
            <input 
              required 
              placeholder={t.picker.batteryPlaceholder} 
              value={customForm.battery} 
              onChange={e => setCustomForm({...customForm, battery: e.target.value})} 
            />
          </div>

          <div className={styles.inputWrap}>
            <label>{t.picker.autonomyLabel}</label>
            <input 
              required 
              placeholder={t.picker.autonomyPlaceholder} 
              value={customForm.autonomy} 
              onChange={e => setCustomForm({...customForm, autonomy: e.target.value})} 
            />
          </div>

          <div className={styles.modalActions}>
            <button type="submit" className={styles.modalBtnSave}>
              {t.common.save}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};