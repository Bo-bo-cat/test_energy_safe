'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

// Імпортуємо твої нові іконки
import { CameraIcon } from '../../components/icons/Camera';
import { CalcIcon } from '../../components/icons/Calc';
import { ScenarioIcon } from '../../components/icons/Scenario';
import { SystemIcon } from '../../components/icons/System';

export default function DashboardPage() {
  const [systems, setSystems] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Обраний сценарій для відображення статистики (за замовчуванням перший)
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const [resSys, resScen, resDev] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const dataSys = await resSys.json();
      const dataScen = await resScen.json();
      const dataDev = await resDev.json();

      setSystems(Array.isArray(dataSys) ? dataSys : (dataSys.data || []));
      
      const scens = Array.isArray(dataScen) ? dataScen : [];
      setScenarios(scens);
      if (scens.length > 0) {
        setActiveScenarioId(scens[0].id); // Робимо перший сценарій активним
      }

      setDevices(Array.isArray(dataDev) ? dataDev : (dataDev.data || []));
    } catch (err) {
      console.error('Помилка завантаження даних:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Шукаємо ДБЖ, обране для розрахунку
  const selectedSystem = systems.find(s => s.selected_for_calculation === true) || systems[0];
  const systemName = selectedSystem ? (selectedSystem.model || 'Оберіть систему') : 'Оберіть систему';
  const systemPower = selectedSystem ? (selectedSystem.power || 0) : 0;

  // Дані активного сценарію
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || null;
  const loadWatts = activeScenario ? (activeScenario.totalPowerWatts || activeScenario.total_power_watts || 0) : 0;
  const autonomy = activeScenario ? (activeScenario.autonomyHours || activeScenario.autonomy_hours || activeScenario.duration_hours || 0) : 0;
  
  // Прогрес у відсотках (обмежено 100%)
  const loadPercent = activeScenario ? (activeScenario.loadPercent || activeScenario.load_percent || 0) : 0;
  const safePercent = Math.min(Math.round(loadPercent), 100);

  // Налаштування для SVG напівкола
  const radius = 80;
  const circumference = Math.PI * radius; // Довжина півкола (251.32)
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;
  
  // Колір прогресу
  let progressColor = '#FF9500'; 
  if (safePercent > 90) progressColor = '#FF2D55'; 

  if (isLoading) {
    return <div className={styles.wrap}><p style={{ color: 'var(--text-muted)' }}>Завантаження...</p></div>;
  }

  return (
    <div className={styles.wrap}>
      
      {/* ВЕРХНІЙ РЯД */}
      <div className={styles.topGrid}>
        
        {/* Картка Статусу */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Статус системи</h2>
          <div className={styles.statusContent}>
            
            {/* SVG Напівколо */}
            <div className={styles.donutWrapper}>
              <svg width="200" height="100" viewBox="0 0 200 100">
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--border-color)" strokeWidth="16" strokeLinecap="round" />
                <path 
                  d="M 20 100 A 80 80 0 0 1 180 100" 
                  fill="none" 
                  stroke={progressColor} 
                  strokeWidth="16" 
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className={styles.donutText}>
                <div className={styles.donutPercent}>{safePercent}%</div>
                <div className={styles.donutLabel}>{loadWatts} Вт з {systemPower} Вт</div>
              </div>
            </div>

            {/* Статистика справа */}
            <div className={styles.statusStats}>
              <div className={styles.statBoxOutline}>
                <div className={styles.statBoxOutlineValue}>{loadWatts}</div>
                <div className={styles.statBoxOutlineLabel}>Робоча, Вт</div>
              </div>
              <div className={styles.statBoxOutline}>
                <div className={styles.statBoxOutlineValue}>
                  {loadWatts > 0 ? Math.round(loadWatts * 2.5) : 0}
                </div>
                <div className={styles.statBoxOutlineLabel}>Пуск, Вт</div>
              </div>
              <div className={styles.statBoxOutline}>
                <div className={styles.statBoxOutlineValue}>
                  {typeof autonomy === 'number' ? autonomy.toFixed(1) : autonomy}
                </div>
                <div className={styles.statBoxOutlineLabel}>Автономія, Год</div>
              </div>
            </div>

          </div>
        </div>

        {/* Картка ДБЖ */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>ДБЖ - {systemName}</h2>
          <div className={styles.upsSpecs}>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>Тип</span>
              <span className={styles.upsValue}>{selectedSystem?.type || 'Портативна станція'}</span>
            </div>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>Потужність</span>
              <span className={styles.upsValue}>{systemPower} Вт</span>
            </div>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>Батарея</span>
              <span className={styles.upsValue}>{selectedSystem?.battery || 'Невідомо'}</span>
            </div>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>Автономія</span>
              <span className={styles.upsValue}>{typeof autonomy === 'number' ? autonomy.toFixed(1) : autonomy} год</span>
            </div>
          </div>
        </div>

      </div>

      {/* СЕРЕДНІЙ РЯД */}
      <div className={styles.middleFlex}>
        
        <Link href="/devices" className={styles.actionBtn}>
          <CameraIcon className={styles.actionIcon} />
          <span className={styles.actionText}>Додати прилад</span>
        </Link>
        
        <Link href="/calculator" className={styles.actionBtn}>
          <CalcIcon className={styles.actionIcon} />
          <span className={styles.actionText}>Розрахувати</span>
        </Link>

        <Link href="/scenarios" className={styles.actionBtn}>
          <ScenarioIcon className={styles.actionIcon} />
          <span className={styles.actionText}>Сценарії</span>
        </Link>

        <Link href="/picker" className={styles.actionBtn}>
          <SystemIcon className={styles.actionIcon} />
          <span className={styles.actionText}>Підбір системи</span>
        </Link>

        {/* Статистика */}
        <div className={styles.smallStatBox}>
          <div className={styles.smallStatValue}>{devices.length}</div>
          <div className={styles.smallStatLabel}>Приладів<br/>зареєстровано</div>
        </div>
        <div className={styles.smallStatBox}>
          <div className={styles.smallStatValue}>{scenarios.length}</div>
          <div className={styles.smallStatLabel}>Сценарії<br/>активних</div>
        </div>
        <div className={styles.smallStatBox}>
          <div className={styles.smallStatValue}>
            {devices.length > 0 && activeScenario?.selectedDeviceIds 
              ? Math.round((activeScenario.selectedDeviceIds.length / devices.length) * 100) 
              : 0}%
          </div>
          <div className={styles.smallStatLabel}>Приладів<br/>включено</div>
        </div>

      </div>

      {/* НИЖНІЙ РЯД */}
      <h2 className={styles.sectionTitle}>Ваші сценарії</h2>
      <div className={styles.scenariosFlex}>
        {scenarios.length > 0 ? (
          scenarios.map(scen => (
            <div 
              key={scen.id} 
              className={`${styles.scenarioChip} ${activeScenarioId === scen.id ? styles.active : ''}`}
              onClick={() => setActiveScenarioId(scen.id)}
            >
              {scen.name}
              {activeScenarioId === scen.id && (
                <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>У вас ще немає збережених сценаріїв.</p>
        )}
      </div>

    </div>
  );
}