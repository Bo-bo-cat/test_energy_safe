'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

import { DeleteIcon } from '../../../components/icons/Delete'; 
import { PenIcon } from '../../../components/icons/Pen'; 
// Припустимо, у тебе є іконка Info або просто використаємо текст/символ
import { DecisionModal } from '../../../components/DecisionModal/DecisionModal';
import { SaveScenarioModal } from '../../../components/SaveScenarioModal/SaveScenarioModal';
import { ScenarioDetailsModal } from '../../../components/ScenarioDetailsModal/ScenarioDetailsModal'; // Імпорт нової модалки
import { useTranslation } from '../../../context/LanguageContext';

export default function ScenariosPage() {
  const { t } = useTranslation();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Стан для модалки деталей
  const [viewingScenario, setViewingScenario] = useState<any | null>(null);
  
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);
  const [editingScenario, setEditingScenario] = useState<{ id: string, name: string } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{t.scenarios.title}</h1>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t.scenarios.loading}</p>
      ) : (
        <div className={styles.grid}>
          {scenarios.map(scenario => {
            const powerWatts = scenario.total_power_watts || 0;
            const autonomyHours = scenario.duration_hours || 0;
            const loadPercent = scenario.load_percent || 0;
            
            return (
              <div 
                key={scenario.id} 
                className={styles.card}
                onClick={() => setViewingScenario(scenario)} // Клік на всю картку відкриває деталі
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    {scenario.name}
                    {/* Візуальна помітка (маленька крапка або іконка) */}
                    <span className={styles.infoMarker}>i</span>
                  </div>
                  <div className={styles.actions}>
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
                      className={`${styles.iconBtn} ${styles.deleteBtn}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setScenarioToDelete(scenario.id);
                      }}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>

                <div>
                  <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                      <span className={styles.statValue}>{powerWatts}</span>
                      <span className={styles.statLabel}>{t.common.w}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statValue}>~{autonomyHours.toFixed(1)}</span>
                      <span className={styles.statLabel}>{t.common.h}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statValue}>{Math.round(loadPercent)}%</span>
                      <span className={styles.statLabel}>інвертор</span>
                    </div>
                  </div>
                  <div className={styles.progressContainer}>
                    <div 
                      className={styles.progressFill} 
                      style={{ 
                        width: `${Math.min(loadPercent, 100)}%`, 
                        backgroundColor: loadPercent > 66 ? '#FF2D55' : loadPercent > 33 ? '#FF9500' : '#34C759' 
                      }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <Link href="/calculator" className={`${styles.card} ${styles.addCard}`}>
            <div className={styles.addIcon}>+</div>
            <div className={styles.addText}>{t.scenarios.addScenario}</div>
          </Link>
        </div>
      )}

      {/* Модалка деталей */}
      <ScenarioDetailsModal 
        isOpen={viewingScenario !== null}
        onClose={() => setViewingScenario(null)}
        scenario={viewingScenario}
      />

      <DecisionModal 
        isOpen={scenarioToDelete !== null}
        onClose={() => setScenarioToDelete(null)}
        onConfirm={async () => {
            const token = localStorage.getItem('access_token');
            const id = scenarioToDelete;
            setScenarioToDelete(null);
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchScenarios();
        }}
      />
      
      {/* Інші модалки (Renaming і т.д.) */}
    </div>
  );
}