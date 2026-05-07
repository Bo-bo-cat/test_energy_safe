'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

import { DeleteIcon } from '../../../components/icons/Delete'; 
import { PenIcon } from '../../../components/icons/Pen'; 
import { DecisionModal } from '../../../components/DecisionModal';

// НОВЕ: Імпортуємо нашу модалку
import { SaveScenarioModal } from '../../../components/SaveScenarioModal';

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);

  // НОВЕ: Стан для редагування назви
  const [editingScenario, setEditingScenario] = useState<{ id: string, name: string } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    // ... (старий код завантаження без змін)
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setScenarios(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setScenarioToDelete(id);
  };

  const confirmDelete = async () => {
    // ... (старий код видалення без змін)
    if (!scenarioToDelete) return;
    const id = scenarioToDelete;
    setScenarioToDelete(null);
    if (selectedScenarioId === id) setSelectedScenarioId(null);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setScenarios(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      fetchScenarios(); 
    }
  };

  // НОВЕ: Функція для збереження нової назви
  const handleRename = async (newName: string) => {
    if (!editingScenario) return;
    setIsRenaming(true);
    const token = localStorage.getItem('access_token');

    try {
      // Оновлюємо назву локально, щоб UI змінився миттєво
      setScenarios(prev => prev.map(s => s.id === editingScenario.id ? { ...s, name: newName } : s));
      
      // Закриваємо модалку
      const currentId = editingScenario.id;
      setEditingScenario(null);

      // Відправляємо PATCH запит на сервер
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/${currentId}`, {
        method: 'PATCH', // або PUT, залежно від того, як налаштовано ваш бекенд
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newName })
      });

    } catch (err) {
      console.error('Помилка перейменування:', err);
      fetchScenarios(); // Якщо помилка - повертаємо старі дані
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCardClick = (id: string) => {
    setSelectedScenarioId(prev => prev === id ? null : id);
  };

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">Мої Сценарії</h1>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Завантаження сценаріїв...</p>
      ) : (
        <div className={styles.grid}>
          
          {scenarios.map(scenario => {
            // ... (старий код розрахунку змінних без змін)
            const powerWatts = scenario.totalPowerWatts || scenario.total_power_watts || 0;
            const autonomyHours = scenario.autonomyHours || scenario.autonomy_hours || scenario.duration_hours || 0;
            const loadPercent = scenario.loadPercent || scenario.load_percent || 0;
            
            const displayAutonomy = typeof autonomyHours === 'number' ? autonomyHours.toFixed(1) : autonomyHours;
            const displayLoad = typeof loadPercent === 'number' ? Math.round(loadPercent) : loadPercent;

            let progressColor = '#34C759'; 
            if (loadPercent > 33 && loadPercent <= 66) progressColor = '#FF9500'; 
            if (loadPercent > 66) progressColor = '#FF2D55'; 
            
            const isSelected = selectedScenarioId === scenario.id;

            return (
              <div 
                key={scenario.id} 
                className={`${styles.card} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleCardClick(scenario.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>{scenario.name}</div>
                  <div className={styles.actions}>
                    {/* НОВЕ: Викликаємо модалку при кліку на олівець */}
                    <button 
                      className={styles.iconBtn} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingScenario({ id: scenario.id, name: scenario.name });
                      }}
                    >
                      <PenIcon/>
                    </button>
                    <button 
                      className={styles.iconBtn} 
                      onClick={(e) => handleDeleteClick(scenario.id, e)}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>

                {/* ... (старий код статистики і прогрес-бару) */}
                <div>
                  <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{powerWatts}</span> Вт
                    </div>
                    <div className={styles.statItem}>
                      ~<span className={styles.statValue}>{displayAutonomy} год</span> автономії
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{displayLoad}%</span> інвертора
                    </div>
                  </div>
                  <div className={styles.progressContainer}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${Math.min(loadPercent || 0, 100)}%`, backgroundColor: progressColor }} 
                    />
                  </div>
                </div>

              </div>
            );
          })}

          <Link href="/calculator" className={`${styles.card} ${styles.addCard}`}>
            <div className={styles.addIcon}>+</div>
            <div className={styles.addText}>Додати сценарій</div>
          </Link>

        </div>
      )}

      <DecisionModal 
        isOpen={scenarioToDelete !== null}
        onClose={() => setScenarioToDelete(null)}
        onConfirm={confirmDelete}
        title="Видалити сценарій?"
      />

      {/* НОВЕ: Додаємо модалку перейменування в кінець */}
      <SaveScenarioModal 
        isOpen={editingScenario !== null}
        onClose={() => setEditingScenario(null)}
        onSave={handleRename}
        isLoading={isRenaming}
        title="Змінити назву"
        initialName={editingScenario?.name || ''}
      />
    </div>
  );
}