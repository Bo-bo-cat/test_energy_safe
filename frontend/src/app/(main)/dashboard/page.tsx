'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

import { CameraIcon } from '../../../components/icons/Camera';
import { CalcIcon } from '../../../components/icons/Calc';
import { ScenarioIcon } from '../../../components/icons/Scenario';
import { SystemIcon } from '../../../components/icons/System';

// Підключаємо словник
import { useTranslation } from '../../../context/LanguageContext';

const cleanModelName = (name: string, fallback: string) => {
  if (!name) return fallback;
  if (name.includes(' - ')) {
    return name.split(' - ')[1].trim();
  }
  return name.replace('ДБЖ - ', '').trim();
};

export default function DashboardPage() {
  const { t } = useTranslation();

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
      console.error(t.common.error, err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || null;
  const loadWatts = activeScenario ? Number(activeScenario.totalPowerWatts || activeScenario.total_power_watts || 0) : 0;
  const autonomy = activeScenario ? Number(activeScenario.autonomyHours || activeScenario.autonomy_hours || activeScenario.duration_hours || 0) : 0;
  
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

  const rawSystemName = displaySystem ? (displaySystem.model || displaySystem.name || t.dashboard.chooseSystem) : t.dashboard.chooseSystem;
  const systemName = cleanModelName(rawSystemName, t.dashboard.chooseSystem);
  const systemPower = displaySystem ? Number(displaySystem.power || 0) : 0;
  const systemBattery = displaySystem ? (displaySystem.battery || t.dashboard.unknown) : t.dashboard.unknown;

  const calculatedPercent = systemPower > 0 ? (loadWatts / systemPower) * 100 : 0;
  const safePercent = Math.min(Math.round(calculatedPercent), 100);

  const radius = 90; 
  const circumference = Math.PI * radius; 
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;
  
  let progressColor = '#34C759'; 
  if (safePercent > 33 && safePercent <= 66) {
    progressColor = '#FF9500'; 
  } else if (safePercent > 66) {
    progressColor = '#FF2D55'; 
  }

  const activeDevices = activeScenario && activeScenario.selectedDeviceIds
    ? devices.filter(d => activeScenario.selectedDeviceIds.includes(d.id || d._id))
    : [];

  // МАГІЯ БЛОКУВАННЯ СВАЙПІВ (Зупиняємо спливання подій дотику)
  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
    onTouchMove: (e: React.TouchEvent) => e.stopPropagation(),
    onTouchEnd: (e: React.TouchEvent) => e.stopPropagation(),
    onTouchCancel: (e: React.TouchEvent) => e.stopPropagation(),
  };

  if (isLoading) {
    return (
      <div className="global-page-wrap">
        <p style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="global-page-wrap" style={{ overflowX: 'clip' }}>
      
      {/* Додаємо обробники до всіх блоків, що можуть скролитися */}
      <div className={styles.topGrid} {...swipeHandlers}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{t.dashboard.systemStatus}</h2>
          <div className={styles.statusContent}>
            <div className={styles.donutWrapper}>
              <svg width="100%" height="100%" viewBox="0 0 220 120" className={styles.donutSvg}>
                <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="var(--border-color)" strokeWidth="20" strokeLinecap="butt" />
                <path 
                  d="M 20 110 A 90 90 0 0 1 200 110" 
                  fill="none" 
                  stroke={progressColor} 
                  strokeWidth="20" 
                  strokeLinecap="butt"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease' }}
                />
              </svg>
              <div className={styles.donutText}>
                <div className={styles.donutPercent}>{safePercent}%</div>
                <div className={styles.donutLabel}>{loadWatts} {t.dashboard.fromTotal} {systemPower} {t.common.w}</div>
              </div>
            </div>

            <div className={styles.statusStats}>
              <div className={styles.statBoxOutline}>
                <div className={styles.statBoxOutlineValue}>{loadWatts}</div>
                <div className={styles.statBoxOutlineLabel}>{t.dashboard.workingW}</div>
              </div>
              <div className={styles.statBoxOutline}>
                <div className={styles.statBoxOutlineValue}>
                  {loadWatts > 0 ? Math.round(loadWatts * 2.5) : 0}
                </div>
                <div className={styles.statBoxOutlineLabel}>{t.dashboard.startupW}</div>
              </div>
              <div className={styles.statBoxOutline}>
                <div className={styles.statBoxOutlineValue}>
                  {typeof autonomy === 'number' ? autonomy.toFixed(1) : autonomy}
                </div>
                <div className={styles.statBoxOutlineLabel}>{t.dashboard.autonomyH}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{systemName}</h2>
          <div className={styles.upsSpecs}>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>{t.common.type}</span>
              <span className={styles.upsValue}>{displaySystem?.type || t.dashboard.portableStation}</span>
            </div>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>{t.common.power}</span>
              <span className={styles.upsValue}>{systemPower} {t.common.w}</span>
            </div>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>{t.common.battery}</span>
              <span className={styles.upsValue}>{systemBattery}</span>
            </div>
            <div className={styles.upsRow}>
              <span className={styles.upsLabel}>{t.common.autonomy}</span>
              <span className={styles.upsValue}>{typeof autonomy === 'number' ? autonomy.toFixed(1) : autonomy} {t.common.h}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.middleFlex}>
        {/* Додаємо обробники до швидких дій */}
        <div className={styles.actionsGroup} {...swipeHandlers}>
          <Link href="/devices" className={styles.actionBtn}>
            <CameraIcon className={styles.actionIcon} />
            <span className={styles.actionText}>{t.dashboard.addDevice}</span>
          </Link>
          <Link href="/calculator" className={styles.actionBtn}>
            <CalcIcon className={styles.actionIcon} />
            <span className={styles.actionText}>{t.dashboard.calculate}</span>
          </Link>
          <Link href="/scenarios" className={styles.actionBtn}>
            <ScenarioIcon className={styles.actionIcon} />
            <span className={styles.actionText}>{t.dashboard.scenarios}</span>
          </Link>
          <Link href="/picker" className={styles.actionBtn}>
            <SystemIcon className={styles.actionIcon} />
            <span className={styles.actionText}>{t.dashboard.pickSystem}</span>
          </Link>
        </div>

        <div className={styles.statsGroup}>
          <div className={styles.smallStatBox}>
            <div className={styles.smallStatValue}>{devices.length}</div>
            <div className={styles.smallStatLabel} dangerouslySetInnerHTML={{ __html: t.dashboard.devicesRegistered.replace(' ', '<br/>') }} />
          </div>
          <div className={styles.smallStatBox}>
            <div className={styles.smallStatValue}>{scenarios.length}</div>
            <div className={styles.smallStatLabel} dangerouslySetInnerHTML={{ __html: t.dashboard.activeScenarios.replace(' ', '<br/>') }} />
          </div>
          <div className={styles.smallStatBox}>
            <div className={styles.smallStatValue}>
              {devices.length > 0 && activeScenario?.selectedDeviceIds 
                ? Math.round((activeScenario.selectedDeviceIds.length / devices.length) * 100) 
                : 0}%
            </div>
            <div className={styles.smallStatLabel} dangerouslySetInnerHTML={{ __html: t.dashboard.devicesIncluded.replace(' ', '<br/>') }} />
          </div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>{t.dashboard.yourScenarios}</h2>
      
      {/* Додаємо обробники до сценаріїв */}
      <div className={`${styles.scenariosFlex} no-swipe`} {...swipeHandlers}>
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
          <p style={{ color: 'var(--text-muted)' }}>{t.dashboard.noScenarios}</p>
        )}
      </div>

      {activeScenario && (
        <div className={styles.activeDevicesWrapper}>
          <h3 className={styles.activeDevicesTitle}>{t.dashboard.devicesInScenario}</h3>
          {activeDevices.length > 0 ? (
            
            <div className={`${styles.activeDevicesGrid} no-swipe`} {...swipeHandlers}>
              {activeDevices.map(dev => {
                const qty = activeScenario.deviceQuantities ? (activeScenario.deviceQuantities[dev.id || dev._id] || 1) : 1;
                const power = dev.powerWatts || dev.power_watts || dev.power || 0;
                const deviceName = dev.model_name || dev.name || dev.model || t.common.model;
                
                return (
                  <div key={dev.id || dev._id} className={styles.activeDeviceCard}>
                    <div className={styles.activeDeviceName} title={deviceName}>
                      {qty > 1 ? <span className={styles.qtyBadge}>{qty}x</span> : null}
                      <span className={styles.truncateText}>{deviceName}</span>
                    </div>
                    <div className={styles.activeDevicePower}>{power * qty} {t.common.w}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t.dashboard.noDevicesInScenario}</p>
          )}
        </div>
      )}
    </div>
  );
}