'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

import { CameraIcon } from '../../../components/icons/Camera_2';
import { CalcIcon } from '../../../components/icons/Calc';
import { ScenarioIcon } from '../../../components/icons/Scenario';
import { SystemIcon } from '../../../components/icons/System';

const cleanModelName = (name: string) => {
  if (!name) return 'Оберіть систему';
  if (name.includes(' - ')) {
    return name.split(' - ')[1].trim();
  }
  return name.replace('ДБЖ - ', '').trim();
};

export default function DashboardPage() {
  const [systems, setSystems] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        setActiveScenarioId(scens[0].id); 
      }

      setDevices(Array.isArray(dataDev) ? dataDev : (dataDev.data || []));
    } catch (err) {
      console.error('Помилка завантаження даних:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || null;
  const loadWatts = activeScenario ? (activeScenario.totalPowerWatts || activeScenario.total_power_watts || 0) : 0;
  const autonomy = activeScenario ? (activeScenario.autonomyHours || activeScenario.autonomy_hours || activeScenario.duration_hours || 0) : 0;
  
  let displaySystem = null;
  
  if (activeScenario) {
    const linkedSystemId = activeScenario.selectedSystemId || activeScenario.systemId;
    if (linkedSystemId) {
      displaySystem = systems.find(s => String(s.id || s._id) === String(linkedSystemId));
    }
  }

  if (!displaySystem && systems.length > 0) {
    displaySystem = systems.find(s => s.selected_for_calculation === true) || systems[0];
  }

  const rawSystemName = displaySystem ? (displaySystem.model || displaySystem.name || 'Оберіть систему') : 'Оберіть систему';
  const systemName = cleanModelName(rawSystemName);
  const systemPower = displaySystem ? (displaySystem.power || 0) : 0;
  const systemBattery = displaySystem ? (displaySystem.battery || 'Невідомо') : 'Невідомо';

  const loadPercent = activeScenario ? (activeScenario.loadPercent || activeScenario.load_percent || 0) : 0;
  const safePercent = Math.min(Math.round(loadPercent), 100);

  const radius = 80;
  const circumference = Math.PI * radius; 
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;
  
  let progressColor = '#FF9500'; 
  if (safePercent > 90) progressColor = '#FF2D55'; 

  if (isLoading) {
    return <div className={styles.wrap}><p style={{ color: 'var(--text-muted)' }}>Завантаження...</p></div>;
  }

  return (
    <div className={styles.wrap}>
      
      {/* ВЕРХНІЙ РЯД */}
      <div className={styles.topGrid}>
        
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Статус системи</h2>
          <div className={styles.statusContent}>
            
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
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />
              </svg>
              <div className={styles.donutText}>
                <div className={styles.donutPercent}>{safePercent}%</div>
                <div className={styles.donutLabel}>{loadWatts} Вт з {systemPower} Вт</div>
              </div>
            </div>

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

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{systemName}</h2>
          <div className={styles.upsSpecs}>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>Тип</span>
              <span className={styles.upsValue}>{displaySystem?.type || 'Портативна станція'}</span>
            </div>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>Потужність</span>
              <span className={styles.upsValue}>{systemPower} Вт</span>
            </div>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>Батарея</span>
              <span className={styles.upsValue}>{systemBattery}</span>
            </div>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>Автономія</span>
              <span className={styles.upsValue}>{typeof autonomy === 'number' ? autonomy.toFixed(1) : autonomy} год</span>
            </div>
          </div>
        </div>

      </div>

      {/* СЕРЕДНІЙ РЯД (РОЗДІЛЕНО НА 2 БЛОКИ) */}
      <div className={styles.middleFlex}>
        
        {/* Блок 1: Кнопки дій */}
        <div className={styles.actionsGroup}>
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
        </div>

        {/* Блок 2: Дані (Статистика) */}
        <div className={styles.statsGroup}>
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