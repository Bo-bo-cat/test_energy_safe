'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

import { CheckboxIcon } from '../../../components/icons/Checkbox';
import { CheckboxCheckedIcon } from '../../../components/icons/Checkbox_checked';
import { DeleteIcon } from '../../../components/icons/Delete'; 
import { AlertModal } from '../../../components/AlertModal';
import { DecisionModal } from '../../../components/DecisionModal';

// ПІДКЛЮЧАЄМО СЛОВНИК
import { useTranslation } from '../../../context/LanguageContext';

const API = process.env.NEXT_PUBLIC_API_URL;

const cleanModelName = (name: string, fallback: string) => {
  if (!name) return fallback;
  if (name.includes(' - ')) {
    return name.split(' - ')[1].trim();
  }
  return name;
};

export default function SystemsPage() {
  const { t } = useTranslation();

  const [tab, setTab] = useState<'my' | 'recommended'>('my');
  const [systems, setSystems] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertKey, setAlertKey] = useState(0); 
  const [systemToDelete, setSystemToDelete] = useState<string | null>(null);

  // Стейт для нової модалки власної системи
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    model: '',
    power: '',
    battery: '',
    autonomy: ''
  });

  useEffect(() => {
    fetchMySystems();
    fetchRecommended();
  }, []);

  async function fetchMySystems() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const res = await fetch(`${API}/systems/my`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setSystems(data || []);
      }
    } catch (err) { 
      console.error('Fetch my systems error:', err); 
    }
  }

  async function fetchRecommended() {
    try {
      const res = await fetch(`${API}/systems/recommended`);
      if (res.ok) {
        const data = await res.json();
        setRecommended(data || []);
      }
    } catch (err) { 
      console.error('Fetch recommended error:', err); 
    }
  }

  // Знайти систему через Groq
  const handleAddByName = async () => {
    if (!query.trim()) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const res = await fetch(`${API}/systems/by-name`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ model: query })
      });
      if (res.ok) {
        setQuery('');
        fetchMySystems();
        setIsAlertOpen(true);
        setAlertKey(prev => prev + 1);
      }
    } catch (err) { 
      console.error('Add by name error:', err); 
    }
  };

  // Створити власну систему (Ручне введення)
  const handleCreateCustomSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const res = await fetch(`${API}/systems`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          model: customForm.model, 
          type: 'ДБЖ / Власна збірка', 
          power: Number(customForm.power), 
          battery: customForm.battery, 
          autonomy: customForm.autonomy, 
          selected_for_calculation: false
        }),
      });
      if (res.ok) {
        setIsCustomModalOpen(false);
        setCustomForm({ model: '', power: '', battery: '', autonomy: '' });
        fetchMySystems();
        setIsAlertOpen(true);
        setAlertKey(prev => prev + 1); 
      }
    } catch (err) { 
      console.error('Create custom system error:', err); 
    }
  };

  const handleAddRecommended = async (rec: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const res = await fetch(`${API}/systems`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          model: rec.model, 
          type: rec.type, 
          power: rec.power, 
          battery: rec.battery, 
          autonomy: rec.autonomy, 
          selected_for_calculation: false
        }),
      });
      if (res.ok) {
        fetchMySystems();
        setIsAlertOpen(true);
        setAlertKey(prev => prev + 1); 
      }
    } catch (err) { 
      console.error('Add recommended error:', err); 
    }
  };

  const confirmDelete = async () => {
    if (!systemToDelete) return;
    const id = systemToDelete;
    setSystemToDelete(null); 
    setSystems(prev => prev.filter(s => s.id !== id));
    
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      await fetch(`${API}/systems/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
    } catch (err) { 
      console.error('Delete error:', err); 
      fetchMySystems(); 
    }
  };

  const handleToggleSelect = async (id: string, currentState: boolean) => {
    setSystems(prev => prev.map(s => s.id === id ? { ...s, selected_for_calculation: !currentState } : s));
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      await fetch(`${API}/systems/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ selected_for_calculation: !currentState })
      });
    } catch (err) { 
      console.error('Toggle status error:', err); 
    }
  };

  const displayedList = tab === 'my' ? systems : recommended;

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">
        {tab === 'my' ? t.picker.titleMy : t.picker.titleRec}
      </h1>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${tab === 'my' ? styles.active : ''}`}
          onClick={() => setTab('my')}
        >
          {t.picker.tabMy}
        </button>
        <button 
          className={`${styles.tabBtn} ${tab === 'recommended' ? styles.active : ''}`}
          onClick={() => setTab('recommended')}
        >
          {t.picker.tabRec}
        </button>
      </div>

      {tab === 'my' && (
        <>
          <h2 className={styles.sectionTitle}>{t.picker.enterYours}</h2>
          
          {/* Оновлений блок керування (Пошук + Додавання) */}
          <div className={styles.topControls}>
            <div className={styles.searchGroup}>
              <input 
                type="text" 
                className={styles.addInput} 
                placeholder={t.picker.inputPlaceholder} 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddByName()}
              />
              <button className={styles.addBtn} onClick={handleAddByName}>
                Знайти систему
              </button>
            </div>

            <button className={styles.customSysBtn} onClick={() => setIsCustomModalOpen(true)}>
              Додати власну систему
            </button>
          </div>
        </>
      )}

      {displayedList.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '48px' }}>
          {tab === 'my' ? t.picker.noSaved : t.picker.loadingRec}
        </p>
      )}

      <div className={styles.grid}>
        {displayedList.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>{cleanModelName(item.model, t.common.model)}</div>
              
              <div className={styles.cardActions}>
                {tab === 'my' ? (
                  <button className={styles.iconBtn} onClick={() => setSystemToDelete(item.id)}>
                    <DeleteIcon className={styles.actionIconOrange} />
                  </button>
                ) : (
                  <button className={styles.iconBtn} onClick={() => handleAddRecommended(item)}>
                    <span className={styles.plusIconTop}>+</span>
                  </button>
                )}
              </div>
            </div>

            <div className={styles.specs}>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>{t.common.type}</span>
                <span className={styles.specValue}>{item.type}</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>{t.common.power}</span>
                <span className={styles.specValue}>{item.power} {t.common.w}</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>{t.common.battery}</span>
                <span className={styles.specValue}>{item.battery}</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>{t.common.autonomy}</span>
                <span className={styles.specValue}>{item.autonomy}</span>
              </div>
            </div>

            {tab === 'my' && (
              <div className={styles.calcRow} onClick={() => handleToggleSelect(item.id, item.selected_for_calculation)}>
                <span className={styles.calcLabel}>{t.picker.addToCalc}</span>
                <button className={styles.iconBtn}>
                  {item.selected_for_calculation ? (
                    <CheckboxCheckedIcon className={styles.actionIconOrange} />
                  ) : (
                    <CheckboxIcon className={styles.actionIconOrange} />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {tab === 'recommended' && (
        <div className={styles.hintBox}>
          <div className={styles.hintTitle}>{t.picker.hintTitle}</div>
          <div className={styles.hintText}>{t.picker.hintText}</div>
        </div>
      )}

      {/* МОДАЛКА ВЛАСНОЇ СИСТЕМИ */}
      {isCustomModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCustomModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalHeader}>Додати систему вручну</h3>
            <form onSubmit={handleCreateCustomSystem} className={styles.modalForm}>
              
              <div className={styles.inputWrap}>
                <label>Назва моделі</label>
                <input required type="text" placeholder="Напр. Моя збірка 12V" 
                  value={customForm.model} onChange={e => setCustomForm({...customForm, model: e.target.value})} 
                />
              </div>

              <div className={styles.inputWrap}>
                <label>Потужність (Вт)</label>
                <input required type="number" min="1" placeholder="Напр. 1000" 
                  value={customForm.power} onChange={e => setCustomForm({...customForm, power: e.target.value})} 
                />
              </div>

              <div className={styles.inputWrap}>
                <label>Ємність батареї</label>
                <input required type="text" placeholder="Напр. 100Ah або 1200Wh" 
                  value={customForm.battery} onChange={e => setCustomForm({...customForm, battery: e.target.value})} 
                />
              </div>

              <div className={styles.inputWrap}>
                <label>Приблизна автономія</label>
                <input required type="text" placeholder="Напр. 4-6 год" 
                  value={customForm.autonomy} onChange={e => setCustomForm({...customForm, autonomy: e.target.value})} 
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.modalBtnCancel} onClick={() => setIsCustomModalOpen(false)}>
                  {t.common.no || 'Скасувати'}
                </button>
                <button type="submit" className={styles.modalBtnSave}>
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertModal 
        key={alertKey}
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={t.picker.addedAlert}
      />

      <DecisionModal 
        isOpen={systemToDelete !== null}
        onClose={() => setSystemToDelete(null)}
        onConfirm={confirmDelete}
        title={t.picker.deleteSystem}
        confirmText={t.common.yes}
        cancelText={t.common.no}
      />
    </div>
  );
}