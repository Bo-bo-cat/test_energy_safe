'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

// Іконки
import { DeleteIcon } from '../../../components/icons/Delete'; 
import { PenIcon } from '../../../components/icons/Pen'; 

// Модалка
import { DecisionModal } from '../../../components/DecisionModal';

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Стан для обраного сценарію (підсвічування)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Стан для модалки видалення
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
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
      console.error('Помилка завантаження сценаріїв:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Ця функція лише відкриває модалку
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Щоб клік на іконку не виділяв картку
    setScenarioToDelete(id);
  };

  // А ця функція викликається, коли юзер тисне "Так" у модалці
  const confirmDelete = async () => {
    if (!scenarioToDelete) return;
    const id = scenarioToDelete;
    
    // Закриваємо модалку
    setScenarioToDelete(null);

    // Якщо ми видаляємо той, що зараз обраний — знімаємо виділення
    if (selectedScenarioId === id) {
      setSelectedScenarioId(null);
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Оптимістичне оновлення
    setScenarios(prev => prev.filter(s => s.id !== id));

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Помилка видалення:', err);
      fetchScenarios(); // Відкочуємо назад у разі помилки
    }
  };

  const handleCardClick = (id: string) => {
    // Якщо клікаємо на вже обраний - знімаємо виділення
    setSelectedScenarioId(prev => prev === id ? null : id);
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Мої Сценарії</h1>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Завантаження сценаріїв...</p>
      ) : (
        <div className={styles.grid}>
          
          {scenarios.map(scenario => {
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
                    <button 
                      className={styles.iconBtn} 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Функція редагування в розробці!');
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
                      style={{ 
                        width: `${Math.min(loadPercent || 0, 100)}%`, 
                        backgroundColor: progressColor 
                      }} 
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

      {/* Підключаємо DecisionModal */}
      <DecisionModal 
        isOpen={scenarioToDelete !== null}
        onClose={() => setScenarioToDelete(null)}
        onConfirm={confirmDelete}
        title="Видалити сценарій?"
      />
    </div>
  );
}