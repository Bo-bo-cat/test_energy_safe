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

import { SaveScenarioModal } from '../../../components/SaveScenarioModal';

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
  const { t } = useTranslation(); // Ініціалізуємо переклад

  const [devices, setDevices] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeLocation, setActiveLocation] = useState('Усі');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);

  const [calcResult, setCalcResult] = useState<{
    totalPowerWatts: number;
    loadPercent: number;
    autonomyHours: number;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        selectedDeviceIds: selectedDeviceIds,
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
  }, [selectedDeviceIds, selectedSystemId]);

  const handleSaveScenario = async (scenarioName: string) => {
    setIsSaving(true);
    const token = localStorage.getItem('access_token');
    
    try {
      const payload = {
        name: scenarioName,
        selectedDeviceIds: selectedDeviceIds,
        selectedSystemId: selectedSystemId, 
        totalPowerWatts: calcResult?.totalPowerWatts || 0,
        loadPercent: calcResult?.loadPercent || 0,
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
  }) : [];

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds(prev => 
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    );
  };

  const toggleCategory = (cat: string) => {
    setActiveCategory(prev => prev === cat ? null : cat);
  };

  const selectedSystem = systems.find(s => String(s.id || s._id) === String(selectedSystemId));
  const rawDisplayName = selectedSystem ? (selectedSystem.model || selectedSystem.type || t.common.model) : t.dashboard.chooseSystem;
  const systemDisplayName = selectedSystem ? cleanModelName(rawDisplayName, t.common.model) : rawDisplayName;

  const loadPercentage = calcResult?.loadPercent || 0;
  const progressWidth = Math.min(loadPercentage, 100);
  
  let progressColor = '#34C759'; 
  if (loadPercentage > 33 && loadPercentage <= 66) {
    progressColor = '#FF9500'; 
  } else if (loadPercentage > 66) {
    progressColor = '#FF2D55'; 
  }

  // Об'єкти для фільтрів, щоб відділити логіку від тексту
  const locations = [
    { id: 'Усі', label: t.common.all },
    { id: 'Дім', label: t.common.home },
    { id: 'Офіс', label: t.common.office }
  ];

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{t.calculator.title}</h1>

      <div className={styles.layout}>
        {/* ЛІВА ЧАСТИНА */}
        <div className={styles['main-content']}>
          
          <div className={styles['filters-row']}>
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

          <div className={styles['icon-filters']}>
            {availableIcons.length > 0 ? (
              availableIcons.map(icon => (
                <div 
                  key={icon}
                  className={`${styles['icon-chip']} ${activeCategory === icon ? styles.active : ''}`}
                  onClick={() => toggleCategory(icon)}
                >
                  {renderDeviceIcon(icon)}
                </div>
              ))
            ) : (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                {t.calculator.noDevicesInLocation}
              </span>
            )}
          </div>

          {/* Список приладів */}
          <div className={styles['device-list']}>
            {!activeCategory ? (
              <p style={{ color: 'var(--text-muted)' }}>{t.calculator.chooseCategory}</p>
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
                    <div className={styles['device-power']}>
                      {device.power_watts || device.power_watt} {t.common.w} {device.startup_current_watts ? `- ${t.devices.startup} ${device.startup_current_watts} ${t.common.w}` : ''}
                    </div>
                  </div>
                )
              })
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>{t.calculator.noDevicesInCategory}</p>
            )}
          </div>

          {/* Сітка Систем */}
          <div className={styles['systems-grid']}>
            <Link href="/picker" className={`${styles['system-card']} ${styles['add-system-card']}`} style={{ textDecoration: 'none' }}>
              <span className={styles['add-icon']}>+</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>{t.calculator.addMyUPS}</span>
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

        {/* ПРАВА ЧАСТИНА (Результати) */}
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
            </div>

            <div className={styles['stat-box']}>
              <div className={`${styles['stat-value']} ${loadPercentage > 100 ? styles.error : ''}`}>
                {calcResult ? calcResult.loadPercent : '0'}%
              </div>
              <div className={styles['stat-label']}>{t.calculator.fromInverter}</div>
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
            disabled={!calcResult || loadPercentage > 100 || selectedDeviceIds.length === 0}
            onClick={() => setIsModalOpen(true)}
          >
            {loadPercentage > 100 ? t.calculator.overload : t.calculator.saveScenario}
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