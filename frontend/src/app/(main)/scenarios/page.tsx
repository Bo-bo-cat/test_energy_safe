'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

// Іконка видалення (з вашого проєкту)
import { DeleteIcon } from '../../../components/icons/Delete'; 
import { PenIcon } from '../../../components/icons/Pen';

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Завантаження сценаріїв
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

  // Видалення сценарію
  const handleDelete = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей сценарій?')) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Оптимістичне оновлення UI (одразу прибираємо картку)
    setScenarios(prev => prev.filter(s => s.id !== id));

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Помилка видалення:', err);
      fetchScenarios(); // Відкочуємо назад, якщо помилка
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Мої Сценарії</h1>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Завантаження сценаріїв...</p>
      ) : (
        <div className={styles.grid}>
          
          {/* Рендер списку сценаріїв */}
          {scenarios.map(scenario => {
            // Математика для відображення
            // Потужність = Загальне споживання (Вт·год) / Тривалість (год)
            const powerWatts = scenario.duration_hours > 0 
              ? Math.round(scenario.total_consumption_wh / scenario.duration_hours) 
              : 0;
            
            const autonomyHours = scenario.duration_hours;
            
            // Оскільки відсоток інвертора не приходить з бекенду сценаріїв, 
            // тимчасово ставимо розрахункове значення або 0.
            const loadPercent = scenario.inverter_load_percent || 0; 
            
            // Кольори прогрес-бару
            let progressColor = '#34C759'; 
            if (loadPercent > 33 && loadPercent <= 66) progressColor = '#FF9500'; 
            if (loadPercent > 66) progressColor = '#FF2D55'; 

            return (
              <div key={scenario.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>{scenario.name}</div>
                  <div className={styles.actions}>
                    <button 
                      className={styles.iconBtn} 
                      onClick={() => alert('Функція редагування в розробці!')}
                    >
                      <PenIcon />
                    </button>
                    <button 
                      className={styles.iconBtn} 
                      onClick={() => handleDelete(scenario.id)}
                    >
                      <DeleteIcon/>
                    </button>
                  </div>
                </div>

                <div>
                  <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{powerWatts}</span> Вт
                    </div>
                    <div className={styles.statItem}>
                      ~<span className={styles.statValue}>{autonomyHours} год</span> автономії
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{loadPercent}%</span> інвертора
                    </div>
                  </div>
                  
                  <div className={styles.progressContainer}>
                    <div 
                      className={styles.progressFill} 
                      style={{ 
                        width: `${Math.min(loadPercent || 21, 100)}%`, // Тимчасово 21% для візуалу, якщо 0
                        backgroundColor: progressColor 
                      }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Кнопка Додати сценарій (Веде на Калькулятор, де створюються сценарії) */}
          <Link href="/calculator" className={`${styles.card} ${styles.addCard}`}>
            <div className={styles.addIcon}>+</div>
            <div className={styles.addText}>Додати сценарій</div>
          </Link>

        </div>
      )}
    </div>
  );
}