// src/components/SaveScenarioModal.tsx
'use client';
import React, { useState } from 'react';
import styles from './SaveScenarioModal.module.css';
import { useTranslation } from '../../context/LanguageContext';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isLoading?: boolean;
  title?: string;
  initialName?: string;
}

export function SaveScenarioModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isLoading, 
  title, 
  initialName = '' 
}: SaveScenarioModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title || t.calculator.saveScenario}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <input 
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.scenariosave.input}
          autoFocus
        />

        <button 
          className={styles.submitBtn}
          onClick={() => onSave(name)}
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? t.common.saving : t.common.save}
        </button>
      </div>
    </div>
  );
}