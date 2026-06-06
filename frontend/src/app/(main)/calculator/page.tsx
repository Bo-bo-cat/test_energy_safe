'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

// Іконки
import { FridgeIcon } from '../../../components/icons/Fridge';
import { LaptopIcon } from '../../../components/icons/Laptop';
import { RouterIcon } from '../../../components/icons/Router';
import { LightIcon } from '../../../components/icons/Light';
import { TvIcon } from '../../../components/icons/Tv';
import { CoffeeMachineIcon } from '../../../components/icons/Coffee_Machine';
import { ChargerIcon } from '../../../components/icons/Charger';
import { ConditionerIcon } from '../../../components/icons/Conditioner';
import { DishWasherIcon } from '../../../components/icons/Dishwasher';
import { WashingMachineIcon } from '../../../components/icons/WashingMachine';
import { OtherIcon } from '../../../components/icons/Other';
import { KettleIcon } from '../../../components/icons/Kettle';
import { MicrowaweIcon } from '../../../components/icons/Microwawe';

import { SaveScenarioModal } from '../../../components/SaveScenarioModal/SaveScenarioModal';
import { AnimatedEmptyIcon } from '../../../components/AnimatedEmptyIcon/AnimatedEmptyIcon';

// ПІДКЛЮЧАЄМО СЛОВНИК
import { useTranslation } from '../../../context/LanguageContext';

const categoryToIcon: Record<string, string> = {
  'Холодильник': 'fridge',
  'Телевізор': 'tv',
  'Пральна машина': 'washing_machine',
  'Мікрохвильовка': 'microwave',
  'Кондиціонер': 'ac',
  'Ноутбук': 'laptop',
  'Роутер': 'router',
  'Освітлення': 'light',
  'Зарядний пристрій': 'charger',
  'Посудомийна машина': 'dishwasher',
  'Електрочайник': 'kettle',
  'Кавоварка': 'coffee',
  'Інше': 'other',
};

const renderDeviceIcon = (iconName?: string) => {
  switch (iconName) {
    case 'fridge': return <FridgeIcon className={styles['device-svg']} />;
    case 'laptop': return <LaptopIcon className={styles['device-svg']} />;
    case 'router': return <RouterIcon className={styles['device-svg']} />;
    case 'light': return <LightIcon className={styles['device-svg']} />;
    case 'tv': return <TvIcon className={styles['device-svg']} />;
    case 'washing_machine': return <WashingMachineIcon className={styles['device-svg']} />;
    case 'microwave': return <MicrowaweIcon className={styles['device-svg']} />;
    case 'ac': return <ConditionerIcon className={styles['device-svg']} />;
    case 'charger': return <ChargerIcon className={styles['device-svg']} />;
    case 'dishwasher': return <DishWasherIcon className={styles['device-svg']} />;
    case 'kettle': return <KettleIcon className={styles['device-svg']} />;
    case 'coffee': return <CoffeeMachineIcon className={styles['device-svg']} />;
    case 'other': return <OtherIcon className={styles['device-svg']} />;
    default: return <div className={styles['device-svg']} style={{ backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />;
  }
};

const cleanModelName = (name: string, fallback: string) => {
  if (!name) return fallback;
  if (name.includes(' - ')) {
    return name.split(' - ')[1].trim();
  }
  return name;
};

export default function CalculatorPage() {
  const { t, lang } = useTranslation();

  const [devices, setDevices] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customLocations, setCustomLocations] = useState<string[]>([]);

  const [activeLocation, setActiveLocation] = useState('Усі');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [deviceHours, setDeviceHours] = useState<Record<string, number>>({});
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);

  const [calcResult, setCalcResult] = useState<{
    totalPowerWatts: number;
    peakPowerWatts?: number; 
    loadPercent: number;
    autonomyHours: number;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.locations)) setCustomLocations(data.locations); })
      .catch(() => {});
  }, []);

  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
    onTouchMove: (e: React.TouchEvent) => e.stopPropagation(),
    onTouchEnd: (e: React.TouchEvent) => e.stopPropagation(),
    onTouchCancel: (e: React.TouchEvent) => e.stopPropagation(),
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/my`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([resDevices, resSystems]) => {
        const dataDevices = await resDevices.json();
        const dataSystems = await resSystems.json();
        
        const devicesArray = Array.isArray(dataDevices) ? dataDevices : (dataDevices.data || []);
        let systemsArray = Array.isArray(dataSystems) ? dataSystems : (dataSystems.data || []);
        
        systemsArray = systemsArray.filter((s: any) => s.selected_for_calculation === true);
        
        setDevices(devicesArray);
        setSystems(systemsArray);

        if (systemsArray.length > 0) {
          setSelectedSystemId(systemsArray[0].id || systemsArray[0]._id);
        }
      })
      .catch(err => console.error(t.common.error, err))
      .finally(() => setIsLoading(false));
  }, [t.common.error]);

  useEffect(() => {
    if (selectedDeviceIds.length === 0 || !selectedSystemId) {
      setCalcResult(null);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/calculator/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        selectedDevices: selectedDeviceIds.map(id => ({
          deviceId: id,
          usageHours: deviceHours[id] ?? 24
        })),
        selectedSystemId: selectedSystemId
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Calc error');
        return res.json();
      })
      .then(data => {
        setCalcResult(data);
      })
      .catch(err => {
        console.error(err);
        setCalcResult(null);
      });
  }, [selectedDeviceIds, selectedSystemId, deviceHours]);

  const selectedSystem = systems.find(s => String(s.id || s._id) === String(selectedSystemId));
  
  let totalNominalPower = 0;
  let maxStartupOverhead = 0;

  const selectedDeviceObjs = devices.filter(d => selectedDeviceIds.includes(d.id || d._id));
  
  selectedDeviceObjs.forEach(d => {
    const power = Number(d.power_watts || d.power_watt || d.power || 0);
    const startup = Number(d.startup_current_watts || d.startup_watts || 0);
    totalNominalPower += power;
    
    const overhead = Math.max(0, startup - power);
    if (overhead > maxStartupOverhead) {
      maxStartupOverhead = overhead;
    }
  });

  const absolutePeakWatts = calcResult?.peakPowerWatts || (totalNominalPower + maxStartupOverhead);
  const systemPower = selectedSystem ? Number(selectedSystem.power || 1) : 1;
  
  const peakLoadPercent = Math.round((absolutePeakWatts / systemPower) * 100);
  
  const baseLoadPercent = calcResult?.loadPercent || 0;
  const displayLoadPercentage = calcResult 
    ? (calcResult.peakPowerWatts ? baseLoadPercent : Math.max(baseLoadPercent, peakLoadPercent)) 
    : 0;
  
  const isOverloaded = displayLoadPercentage > 100;
  const progressWidth = Math.min(displayLoadPercentage, 100);
  
  let progressColor = '#34C759'; 
  if (displayLoadPercentage > 33 && displayLoadPercentage <= 66) {
    progressColor = '#FF9500'; 
  } else if (displayLoadPercentage > 66) {
    progressColor = '#FF2D55'; 
  }

  const handleSaveScenario = async (scenarioName: string) => {
    setIsSaving(true);
    const token = localStorage.getItem('access_token');
    
    try {
      const payload = {
        name: scenarioName,
        selectedDevices: selectedDeviceIds.map(id => ({
          deviceId: id,
          usageHours: deviceHours[id] ?? 24
        })),
        selectedSystemId: selectedSystemId,
        totalPowerWatts: calcResult!.totalPowerWatts,
        loadPercent: displayLoadPercentage,
        autonomyHours: calcResult?.autonomyHours || 0
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Save error');
      }
      
      setIsModalOpen(false);
      window.location.href = '/scenarios'; 
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const locationFilteredDevices = devices.filter(d => {
    return activeLocation === 'Усі' || d.tag === activeLocation || d.tag === 'Усі';
  });

  const availableIcons = Array.from(
    new Set(locationFilteredDevices.map(d => categoryToIcon[d.category]).filter(Boolean))
  );

  const filteredDevices = activeCategory ? locationFilteredDevices.filter(d => {
    return categoryToIcon[d.category] === activeCategory;
  }) : locationFilteredDevices;

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds(prev => {
      if (prev.includes(id)) {
        setDeviceHours(h => { const next = { ...h }; delete next[id]; return next; });
        return prev.filter(did => did !== id);
      }
      setDeviceHours(h => ({ ...h, [id]: 24 }));
      return [...prev, id];
    });
  };

  const setHours = (id: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 24) {
      setDeviceHours(h => ({ ...h, [id]: num }));
    }
  };

  const toggleCategory = (cat: string) => {
    setActiveCategory(prev => prev === cat ? null : cat);
  };

  const rawDisplayName = selectedSystem ? (selectedSystem.model || selectedSystem.type || t.common.model) : t.dashboard.chooseSystem;
  const systemDisplayName = selectedSystem ? cleanModelName(rawDisplayName, t.common.model) : rawDisplayName;

  const locations = [
    { id: 'Усі', label: t.common.all },
    { id: 'Дім', label: t.common.home },
    { id: 'Офіс', label: t.common.office },
    ...customLocations.map(loc => ({ id: loc, label: loc })),
  ];

  return (
  <div className="global-page-wrap">
    
    {/* 1. ВИНЕСЛИ ЗАГОЛОВОК СЮДИ */}
    <h1 className="page-title" style={{ margin: '0 0 24px 0' }}>{t.calculator.title}</h1>
    
    <div className={styles.layout}>
      <div className={styles['main-content']}>
        {/* Звідси h1 ми забрали */}
        
        <div className={styles.devicesSection}>
          <div className={`${styles['filters-row']} no-swipe`} {...swipeHandlers}>
              {locations.map(loc => (
                <div 
                  key={loc.id}
                  className={`${styles['filter-chip']} ${activeLocation === loc.id ? styles.active : ''}`}
                  onClick={() => {
                    setActiveLocation(loc.id);
                    setActiveCategory(null); 
                  }}
                >
                  {loc.label}
                </div>
              ))}
            </div>

            {availableIcons.length > 0 && (
              <div className={`${styles['icon-filters']} no-swipe`} {...swipeHandlers}>
                {availableIcons.map(icon => (
                  <div 
                    key={icon}
                    className={`${styles['icon-chip']} ${activeCategory === icon ? styles.active : ''}`}
                    onClick={() => toggleCategory(icon)}
                  >
                    {renderDeviceIcon(icon)}
                  </div>
                ))}
              </div>
            )}

            <div className={styles['device-list']}>
              {isLoading ? (
                 <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
              ) : filteredDevices.length > 0 ? (
                filteredDevices.map(device => {
                  const id = device.id || device._id; 
                  const isSelected = selectedDeviceIds.includes(id);
                  return (
                    <div
                      key={id}
                      className={`${styles['device-item']} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleDevice(id)}
                    >
                      <div className={styles['device-left']}>
                        <div className={styles.checkbox}>
                          <svg className={styles['check-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span className={styles['device-name']}>{device.model_name || device.name}</span>
                      </div>
                      <div className={styles['device-right']}>
                        <div className={styles['device-power']}>
                          {device.power_watts || device.power_watt} {t.common.w}{device.startup_current_watts ? ` · ${(t.devices as any)?.startup || 'пуск'} ${device.startup_current_watts} ${t.common.w}` : ''}
                        </div>
                        {isSelected && (
                          <div className={styles['hours-input-wrap']} onClick={e => e.stopPropagation()}>
                            <input
                              className={styles['hours-input']}
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={deviceHours[id] ?? 24}
                              onChange={e => setHours(id, e.target.value)}
                            />
                            <span className={styles['hours-label']}>{t.common.h}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className={styles['empty-state']}>
                  <AnimatedEmptyIcon />
                  <h3 className={styles['empty-title']}>
                    {devices.length === 0 
                      ? (lang === 'uk' ? 'Немає приладів' : 'No devices found')
                      : (lang === 'uk' ? 'Немає приладів у цій категорії' : 'No devices in this category')}
                  </h3>
                  <p className={styles['empty-desc']}>
                    {devices.length === 0 
                      ? (lang === 'uk' ? 'Для розрахунку необхідно додати хоча б один прилад. Перейдіть до розділу "Прилади", щоб створити свій список.' : 'You need to add at least one device for calculation. Go to the "Devices" section to create your list.')
                      : (lang === 'uk' ? 'У цій локації або категорії ще немає жодного приладу. Оберіть інший фільтр.' : 'There are no devices in this location or category yet. Choose another filter.')}
                  </p>
                  {devices.length === 0 && (
                    <Link href="/devices" className={styles['empty-btn']}>
                      {lang === 'uk' ? 'Перейти до приладів' : 'Go to devices'}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.systemsSection}>
            <h2 className={styles.subSectionTitle}>
              {lang === 'uk' ? 'Система живлення' : 'Power System'}
            </h2>
            <div className={`${styles['systems-grid']} no-swipe`} {...swipeHandlers}>
              <Link href="/picker" className={`${styles['system-card']} ${styles['add-system-card']}`} style={{ textDecoration: 'none' }}>
                <div className={styles['add-card-content']}>
                  <span className={styles['add-icon']}>+</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', textAlign: 'center' }}>
                    {t.calculator.addMyUPS}
                  </span>
                </div>
              </Link>

              {systems.map(sys => {
                const id = sys.id || sys._id;
                const isSelected = selectedSystemId === id;
                
                const rawSysName = sys.model || t.common.model;
                const cleanName = cleanModelName(rawSysName, t.common.model);
                
                return (
                  <div 
                    key={id} 
                    className={`${styles['system-card']} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setSelectedSystemId(id)}
                  >
                    <div className={styles['system-title']}>{cleanName}</div>
                    
                    <div className={styles['system-spec']}>
                      <span className={styles['spec-label']}>{t.common.type}</span>
                      <span className={styles['spec-value']}>{sys.type || t.dashboard.portableStation}</span>
                    </div>
                    <div className={styles['system-spec']}>
                      <span className={styles['spec-label']}>{t.common.power}</span>
                      <span className={styles['spec-value']}>{sys.power} {t.common.w}</span>
                    </div>
                    <div className={styles['system-spec']}>
                      <span className={styles['spec-label']}>{t.common.battery}</span>
                      <span className={styles['spec-value']}>{sys.battery}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        <div className={styles['summary-panel']}>
          <div className={styles['summary-title']}>
            {systemDisplayName}
          </div>

          <div className={styles['stats-grid']}>
            <div className={styles['stat-box']}>
              <div className={styles['stat-value']}>
                {calcResult ? calcResult.totalPowerWatts : '0'}
              </div>
              <div className={styles['stat-label']}>{t.calculator.totalW}</div>
              {calcResult && calcResult.peakPowerWatts && calcResult.peakPowerWatts > calcResult.totalPowerWatts && (
                <div style={{ fontSize: '10px', color: 'var(--accent-orange)', marginTop: '2px', fontWeight: 700, lineHeight: 1.1 }}>
                  {(t.calculator as any)?.peakLabel || 'Пік'} {calcResult.peakPowerWatts} {t.common.w}
                </div>
              )}
            </div>

            <div className={styles['stat-box']}>
              <div className={`${styles['stat-value']} ${isOverloaded ? styles.error : ''}`}>
                {calcResult ? displayLoadPercentage : '0'}%
              </div>
              <div className={styles['stat-label']}>{t.calculator.fromInverter}</div>
              {calcResult && calcResult.peakPowerWatts && calcResult.peakPowerWatts <= calcResult.totalPowerWatts && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.1 }}>
                  {(t.calculator as any)?.noStartup || 'Без пускових'}
                </div>
              )}
            </div>

            <div className={styles['stat-box']}>
              <div className={styles['stat-value']}>
                {calcResult ? calcResult.autonomyHours : '0'}
              </div>
              <div className={styles['stat-label']}>{t.calculator.autonomyH}</div>
            </div>
          </div>

          <div className={styles['progress-container']}>
            <div 
              className={styles['progress-fill']} 
              style={{ 
                width: `${progressWidth}%`, 
                backgroundColor: progressColor 
              }} 
            />
          </div>

          <button 
            className={styles['save-btn']}
            disabled={!calcResult || isOverloaded || selectedDeviceIds.length === 0}
            onClick={() => setIsModalOpen(true)}
          >
            {isOverloaded ? t.calculator.overload : t.calculator.saveScenario}
          </button>
        </div>
      </div>

      <SaveScenarioModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveScenario}
        isLoading={isSaving}
      />
    </div>
  );
}