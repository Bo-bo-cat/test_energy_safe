'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import toast from 'react-hot-toast';

import { CheckboxIcon } from '../../../components/icons/Checkbox';
import { CheckboxCheckedIcon } from '../../../components/icons/Checkbox_checked';
import { DeleteIcon } from '../../../components/icons/Delete'; 
import { PenIcon } from '../../../components/icons/Pen'; // ІМПОРТ ІКОНКИ РЕДАГУВАННЯ
import { SystemIcon } from '../../../components/icons/System'; 
import { DecisionModal } from '../../../components/DecisionModal/DecisionModal';
import { AddSystemModal } from '../../../components/AddSystemModal/AddSystemModal';
import { useTranslation } from '../../../context/LanguageContext';

const API = process.env.NEXT_PUBLIC_API_URL;

const cleanModelName = (name: string, fallback: string) => {
  if (!name) return fallback;
  if (name.includes(' - ')) return name.split(' - ')[1].trim();
  return name;
};

export default function SystemsPage() {
  const { t, lang } = useTranslation();

  const [tab, setTab] = useState<'my' | 'recommended'>('my');
  const [systems, setSystems] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  
  const [systemToDelete, setSystemToDelete] = useState<string | null>(null);
  
  // Стейт для створення
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<{ model: string; power: string; battery: string } | null>(null);
  
  // ДОДАНО: Стейт для редагування існуючої системи
  const [editingSystem, setEditingSystem] = useState<any | null>(null);

  const [hiddenAutonomy, setHiddenAutonomy] = useState('');
  const [hiddenType, setHiddenType] = useState('ДБЖ / Власна збірка');

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
      console.error(err); 
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
      console.error(err); 
    }
  }

  const handleAddByName = async () => {
    if (!query.trim()) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    const toastId = toast.loading(lang === 'uk' ? 'Пошук характеристик...' : 'Searching specs...');
    
    try {
      const res = await fetch(`${API}/systems/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ model: query })
      });
      
      if (res.ok) {
        const data = await res.json();
        setQuery('');
        toast.dismiss(toastId);
        
        setModalInitialData({
          model: data.model || query,
          power: data.power ? String(data.power) : '',
          battery: data.battery ? String(data.battery) : ''
        });
        
        setHiddenAutonomy(data.autonomy || '');
        setHiddenType(data.type || 'ДБЖ / Власна збірка');
        
        setIsCustomModalOpen(true);
      } else {
        toast.dismiss(toastId);
        toast.error(lang === 'uk' ? 'Систему не знайдено' : 'System not found');
      }
    } catch (err) { 
      console.error(err); 
      toast.dismiss(toastId);
      toast.error(t.common.error);
    }
  };

  const handleOpenEmptyModal = () => {
    setModalInitialData(null);
    setHiddenAutonomy(''); 
    setHiddenType('ДБЖ / Власна збірка');
    setIsCustomModalOpen(true);
  };

  const handleCreateCustomSystem = async (formData: { model: string; power: string; battery: string }) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const res = await fetch(`${API}/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          power: Number(formData.power),
          type: hiddenType,
          autonomy: hiddenAutonomy || '-',
          selected_for_calculation: true 
        }),
      });
      
      if (res.ok) {
        setIsCustomModalOpen(false);
        fetchMySystems();
        toast.success(lang === 'uk' ? 'Систему збережено' : 'System saved');
      } else {
        toast.error(lang === 'uk' ? 'Помилка збереження системи' : 'Error saving system');
      }
    } catch (err) { 
      console.error(err); 
      toast.error(t.common.error);
    }
  };

  // ДОДАНО: Логіка оновлення існуючої системи
  const handleUpdateSystem = async (formData: { model: string; power: string; battery: string }) => {
    if (!editingSystem) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const res = await fetch(`${API}/systems/${editingSystem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: formData.model,
          power: Number(formData.power),
          battery: formData.battery
        }),
      });

      if (res.ok) {
        setEditingSystem(null);
        fetchMySystems();
        toast.success(lang === 'uk' ? 'Систему оновлено' : 'System updated');
      } else {
        toast.error(lang === 'uk' ? 'Помилка оновлення' : 'Update error');
      }
    } catch (err) {
      console.error(err);
      toast.error(t.common.error);
    }
  };

  const handleAddRecommended = async (rec: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: rec.model, 
          type: rec.type, 
          power: rec.power, 
          battery: rec.battery, 
          autonomy: rec.autonomy, 
          selected_for_calculation: true 
        }),
      });
      if (res.ok) {
        fetchMySystems();
        toast.success(lang === 'uk' ? 'Систему додано' : 'System added');
      }
    } catch (err) { 
      console.error(err); 
      toast.error(t.common.error);
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
      toast.success(lang === 'uk' ? 'Систему видалено' : 'System deleted');
    } catch (err) { 
      console.error(err); 
      fetchMySystems(); 
      toast.error(t.common.error);
    }
  };

  const handleToggleSelect = async (id: string, currentState: boolean) => {
    const newState = !currentState;
    setSystems(prev => prev.map(s => s.id === id ? { ...s, selected_for_calculation: newState } : s));
    
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      await fetch(`${API}/systems/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ selected_for_calculation: newState })
      });
      if (newState) {
        toast.success(lang === 'uk' ? 'Додано до розрахунку' : 'Added to calculation');
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const displayedList = tab === 'my' ? systems : recommended;

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{tab === 'my' ? t.picker.titleMy : t.picker.titleRec}</h1>

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
          <div className={styles.topControls}>
            <input 
              type="text" 
              className={styles.addInput} 
              placeholder={t.picker.inputPlaceholder} 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddByName()}
            />
            <button className={styles.addBtn} onClick={handleAddByName}>
              {t.picker?.findSystem || 'Знайти систему'}
            </button>
            <button className={styles.customSysBtn} onClick={handleOpenEmptyModal}>
              {t.picker?.addCustomSystem || 'Додати свою систему'}
            </button>
          </div>
        </>
      )}

      {displayedList.length === 0 ? (
        <div className={styles['empty-state']}>
          <div className={styles['empty-icon-wrap']}>
            <SystemIcon className={styles['empty-svg']} />
          </div>
          <h3 className={styles['empty-title']}>
            {tab === 'my' 
              ? (lang === 'uk' ? 'Немає систем' : 'No systems found') 
              : (lang === 'uk' ? 'Немає рекомендацій' : 'No recommendations')}
          </h3>
          <p className={styles['empty-desc']}>
            {tab === 'my' 
              ? (lang === 'uk' ? 'Ви ще не додали жодної системи резервного живлення. Знайдіть її в базі або додайте вручну.' : 'You haven\'t added any power systems yet. Find one in the database or add manually.') 
              : (lang === 'uk' ? 'Завантаження списку рекомендованих систем...' : 'Loading recommendations list...')}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayedList.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>{cleanModelName(item.model, t.common.model)}</div>
                
                <div className={styles.cardActions}>
                  {tab === 'my' ? (
                    <>
                      {/* ДОДАНО: Кнопка редагування */}
                      <button className={styles.iconBtn} onClick={() => setEditingSystem(item)}>
                        <PenIcon className={styles.actionIconGray} />
                      </button>
                      <button className={styles.iconBtn} onClick={() => setSystemToDelete(item.id)}>
                        <DeleteIcon className={styles.actionIconOrange} />
                      </button>
                    </>
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
                  <span className={styles.calcLabel}>
                    {item.selected_for_calculation
                      ? (lang === 'uk' ? 'Прибрати з розрахунку' : 'Remove from calculation')
                      : t.picker.addToCalc}
                  </span>
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
      )}

      {tab === 'recommended' && displayedList.length > 0 && (
        <div className={styles.hintBox}>
          <div className={styles.hintTitle}>{t.picker.hintTitle}</div>
          <div className={styles.hintText}>{t.picker.hintText}</div>
        </div>
      )}

      {/* УНІВЕРСАЛЬНА МОДАЛКА (працює і для створення, і для редагування) */}
      <AddSystemModal 
        isOpen={isCustomModalOpen || editingSystem !== null} 
        onClose={() => {
          setIsCustomModalOpen(false);
          setEditingSystem(null);
        }} 
        onSave={editingSystem ? handleUpdateSystem : handleCreateCustomSystem} 
        initialData={
          editingSystem 
            ? { model: editingSystem.model, power: String(editingSystem.power), battery: editingSystem.battery } 
            : modalInitialData
        }
        title={editingSystem ? (lang === 'uk' ? 'Редагувати систему' : 'Edit system') : undefined}
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