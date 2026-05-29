'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import html2canvas from 'html2canvas';

// Підключаємо словник
import { useTranslation } from '../../../context/LanguageContext';

const cleanModelName = (name: string, fallback: string) => {
  if (!name) return fallback;
  if (name.includes(' - ')) {
    return name.split(' - ')[1].trim();
  }
  return name.replace('ДБЖ - ', '').trim();
};

const ShareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

export default function DashboardPage() {
  const { t, lang } = useTranslation();

  const [systems, setSystems] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  
  const exportRef = useRef<HTMLDivElement>(null);

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
    if (activeScenario.systemSnapshot) {
      displaySystem = activeScenario.systemSnapshot;
    } else {
      const linkedSystemId = activeScenario.selectedSystemId || activeScenario.systemId;
      if (linkedSystemId) {
        displaySystem = systems.find(s => String(s.id || s._id) === String(linkedSystemId));
      }
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

  let groupedActiveDevices: any[] = [];

  if (activeScenario) {
    if (activeScenario.devicesSnapshot && activeScenario.devicesSnapshot.length > 0) {
      const counts: Record<string, number> = {};
      const uniqueDevices: any[] = [];

      activeScenario.devicesSnapshot.forEach((d: any) => {
        if (!counts[d.id]) {
          counts[d.id] = 0;
          uniqueDevices.push(d);
        }
        counts[d.id]++;
      });

      groupedActiveDevices = uniqueDevices.map(d => ({
        ...d,
        qty: counts[d.id],
        calculatedPower: (d.power_watts || d.powerWatts || d.power || 0),
        displayName: d.model_name || d.name || t.common.model
      }));
    } else if (activeScenario.selectedDeviceIds) {
      const selectedIds = activeScenario.selectedDeviceIds;
      const rawDevices = devices.filter(d => selectedIds.includes(d.id || d._id));
      
      groupedActiveDevices = rawDevices.map(dev => {
        const qty = selectedIds.filter((id: string) => id === (dev.id || dev._id)).length || 1;
        return {
          ...dev,
          qty,
          calculatedPower: (dev.powerWatts || dev.power_watts || dev.power || 0),
          displayName: dev.model_name || dev.name || dev.model || t.common.model
        };
      });
    }
  }

  const topExportDevices = [...groupedActiveDevices]
    .map(dev => ({ ...dev, totalPower: dev.calculatedPower * dev.qty }))
    .sort((a, b) => b.totalPower - a.totalPower)
    .slice(0, 4);

  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
    onTouchMove: (e: React.TouchEvent) => e.stopPropagation(),
    onTouchEnd: (e: React.TouchEvent) => e.stopPropagation(),
    onTouchCancel: (e: React.TouchEvent) => e.stopPropagation(),
  };

  const handleShare = async () => {
    if (!exportRef.current || !activeScenario) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#FFFFFF'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Сценарій_${activeScenario.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Помилка генерації зображення:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="global-page-wrap">
        <p style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="global-page-wrap" style={{ overflowX: 'clip', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ВЕРХНІЙ БЛОК: Статус та ДБЖ */}
      <div className={styles.topGrid} {...swipeHandlers}>
        <div className={styles.card}>
          <div className={styles.cardHeaderWithShare}>
            <h2 className={styles.cardTitle}>{t.dashboard.systemStatus}</h2>
            {activeScenario && (
              <button 
                className={styles.shareBtn} 
                onClick={handleShare} 
                disabled={isExporting}
                title="Поділитися сценарієм"
              >
                {isExporting ? <span className={styles.loader}></span> : <ShareIcon />}
              </button>
            )}
          </div>
          
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

      {/* СЕРЕДНІЙ БЛОК: Статистика */}
      <div className={styles.middleFlex}>
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
                ? Math.round((devices.filter(d => activeScenario.selectedDeviceIds.includes(d.id || d._id)).length / devices.length) * 100)
                : 0}%
            </div>
            <div className={styles.smallStatLabel} dangerouslySetInnerHTML={{ __html: t.dashboard.devicesIncluded.replace(' ', '<br/>') }} />
          </div>
        </div>
      </div>

      {/* НОВИЙ ГОРИЗОНТАЛЬНИЙ БЛОК: Сценарії (Карусель) */}
      <div className={styles.horizontalSection}>
        <h2 className={styles.sectionTitle}>{t.dashboard.yourScenarios}</h2>
        {scenarios.length > 0 ? (
          <div className={`${styles.carousel} no-swipe`} {...swipeHandlers}>
            {scenarios.map(scen => (
              <div
                key={scen.id}
                className={`${styles.scenarioCard} ${activeScenarioId === scen.id ? styles.active : ''}`}
                onClick={() => setActiveScenarioId(scen.id)}
              >
                <div className={styles.scenarioItemName} title={scen.name}>{scen.name}</div>
                {activeScenarioId === scen.id && (
                  <div className={styles.activeIndicator}>{lang === 'uk' ? 'Активний' : 'Active'}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyStateMini}>
            <p className={styles.emptyDescMini}>
              {lang === 'uk' ? 'У вас ще немає збережених сценаріїв.' : 'You have no saved scenarios yet.'}
            </p>
            <Link href="/calculator" className={styles.emptyBtnMini}>
              {lang === 'uk' ? 'Створити сценарій' : 'Create scenario'}
            </Link>
          </div>
        )}
      </div>

      {/* НОВИЙ ГОРИЗОНТАЛЬНИЙ БЛОК: Прилади у сценарії (Карусель) */}
      <div className={styles.horizontalSection}>
        <h2 className={styles.sectionTitle}>{t.dashboard.devicesInScenario}</h2>
        {activeScenario ? (
          groupedActiveDevices.length > 0 ? (
            <div className={`${styles.carousel} no-swipe`} {...swipeHandlers}>
              {groupedActiveDevices.map(dev => (
                <div key={dev.id || dev._id} className={styles.deviceCard}>
                  <div className={styles.deviceItemLeft}>
                    {dev.qty > 1 && <span className={styles.qtyBadge}>{dev.qty}x</span>}
                    <span className={styles.deviceItemName} title={dev.displayName}>{dev.displayName}</span>
                  </div>
                  <div className={styles.deviceItemPower}>{dev.calculatedPower * dev.qty} {t.common.w}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              {lang === 'uk' ? 'Немає приладів у цьому сценарії.' : 'No devices in this scenario.'}
            </p>
          )
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>
            {lang === 'uk' ? 'Оберіть сценарій, щоб побачити список приладів.' : 'Select a scenario to view devices.'}
          </p>
        )}
      </div>

      {/* ПРИХОВАНИЙ ШАБЛОН ДЛЯ ЕКСПОРТУ */}
      {activeScenario && (
        <div ref={exportRef} className={styles.exportWrapper}>
          <h1 className={styles.exportTitle}>{activeScenario.name}</h1>
          <div className={styles.exportSystemBox}>
            <h2 className={styles.exportSystemName}>{systemName}</h2>
            <div className={styles.exportRow}>
              <span>Тип</span>
              <span className={styles.exportValue}>{displaySystem?.type || t.dashboard.portableStation}</span>
            </div>
            <div className={styles.exportRow}>
              <span>Потужність</span>
              <span className={styles.exportValue}>{systemPower} Вт</span>
            </div>
            <div className={styles.exportRow}>
              <span>Батарея</span>
              <span className={styles.exportValue}>{systemBattery}</span>
            </div>
            <div className={styles.exportRow}>
              <span>Автономія</span>
              <span className={styles.exportValue}>{typeof autonomy === 'number' ? autonomy.toFixed(1) : autonomy} Год</span>
            </div>
          </div>
          <div className={styles.exportDevicesList}>
            {topExportDevices.map(d => (
              <div key={d.id || d._id} className={styles.exportDeviceBox}>
                <span className={styles.exportDeviceName}>
                  {d.qty > 1 ? `${d.qty}x ` : ''}{d.displayName}
                </span>
                <span className={styles.exportDevicePower}>{d.totalPower} Вт</span>
              </div>
            ))}
          </div>
          <div className={styles.exportProgressContainer}>
            <div className={styles.exportProgressText} style={{ color: progressColor }}>
              {safePercent}%
            </div>
            <div className={styles.exportProgressBar}>
              <div className={styles.exportProgressFill} style={{ width: `${safePercent}%`, backgroundColor: progressColor }} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}