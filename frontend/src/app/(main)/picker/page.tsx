'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

import { CheckboxIcon } from '../../../components/icons/Checkbox';
import { CheckboxCheckedIcon } from '../../../components/icons/Checkbox_checked';
import { DeleteIcon } from '../../../components/icons/Delete'; 
import { AlertModal } from '../../../components/AlertModal';
import { DecisionModal } from '../../../components/DecisionModal';

const API = process.env.NEXT_PUBLIC_API_URL;

// Функція для очищення назви
const cleanModelName = (name: string) => {
  if (!name) return 'Модель';
  if (name.includes(' - ')) {
    return name.split(' - ')[1].trim();
  }
  return name;
};

export default function SystemsPage() {
  const [tab, setTab] = useState<'my' | 'recommended'>('my');
  const [systems, setSystems] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  
  // Стейт для алерту успішного додавання
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  // Стейт для модалки підтвердження видалення
  const [systemToDelete, setSystemToDelete] = useState<string | null>(null);

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
      console.error('Помилка завантаження моїх систем:', err); 
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
      console.error('Помилка завантаження рекомендованих систем:', err); 
    }
  }

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
      }
    } catch (err) { 
      console.error('Помилка додавання системи за назвою:', err); 
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
        setIsAlertOpen(true); // Показуємо алерт "Додано"
      }
    } catch (err) { 
      console.error('Помилка додавання рекомендованої системи:', err); 
    }
  };

  const confirmDelete = async () => {
    if (!systemToDelete) return;
    
    const id = systemToDelete;
    setSystemToDelete(null); // Закриваємо модалку
    
    // Оновлюємо UI миттєво
    setSystems(prev => prev.filter(s => s.id !== id));
    
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      await fetch(`${API}/systems/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
    } catch (err) { 
      console.error('Помилка видалення:', err); 
      fetchMySystems(); // Відкочуємо зміни при помилці
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
      console.error('Помилка оновлення статусу:', err); 
    }
  };

  const displayedList = tab === 'my' ? systems : recommended;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.pageTitle}>
        {tab === 'my' ? 'Система' : 'Рекомендовані системи'}
      </h1>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${tab === 'my' ? styles.active : ''}`}
          onClick={() => setTab('my')}
        >
          Мої системи
        </button>
        <button 
          className={`${styles.tabBtn} ${tab === 'recommended' ? styles.active : ''}`}
          onClick={() => setTab('recommended')}
        >
          Рекомендовані
        </button>
      </div>

      {tab === 'my' && (
        <>
          <h2 className={styles.sectionTitle}>Введіть вашу систему</h2>
          <div className={styles.inputRow}>
            <input 
              type="text" 
              className={styles.addInput} 
              placeholder="Наприклад: Ecoflow" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddByName()}
            />
            <button className={styles.addBtn} onClick={handleAddByName}>
              Додати систему
            </button>
          </div>
        </>
      )}

      {displayedList.length === 0 && (
        <p style={{ color: '#A0A0A0', fontWeight: 500, marginBottom: '48px' }}>
          {tab === 'my' ? 'У вас ще немає збережених систем.' : 'Рекомендовані системи завантажуються...'}
        </p>
      )}

      <div className={styles.grid}>
        {displayedList.map((item) => (
          <div key={item.id} className={styles.card}>
            
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>{cleanModelName(item.model)}</div>
              
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
                <span className={styles.specLabel}>Тип</span>
                <span className={styles.specValue}>{item.type}</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Потужність</span>
                <span className={styles.specValue}>{item.power} Вт</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Батарея</span>
                <span className={styles.specValue}>{item.battery}</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Автономія</span>
                <span className={styles.specValue}>{item.autonomy}</span>
              </div>
            </div>

            {tab === 'my' && (
              <div className={styles.calcRow} onClick={() => handleToggleSelect(item.id, item.selected_for_calculation)}>
                <span className={styles.calcLabel}>Додати до Розрахунку</span>
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
          <div className={styles.hintTitle}>Підказка</div>
          <div className={styles.hintText}>Додайте одну з рекомендованих систем, щоб подивитись як це працює</div>
        </div>
      )}

      {/* Тост-алерт при успішному додаванні */}
      <AlertModal 
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Додано"
      />

      {/* Модалка підтвердження видалення */}
      <DecisionModal 
        isOpen={systemToDelete !== null}
        onClose={() => setSystemToDelete(null)}
        onConfirm={confirmDelete}
        title="Видалити систему?"
      />
    </div>
  );
}