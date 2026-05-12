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
import { ArrowIcon } from '../../../components/icons/Arrow';
import { DeleteIcon } from '../../../components/icons/Delete';
import { HomeIcon } from '../../../components/icons/Home';
import { OfficeIcon } from '../../../components/icons/Office';
import { CoffeeMachineIcon } from '../../../components/icons/Coffee_Machine';
import { ChargerIcon } from '../../../components/icons/Charger';
import { ConditionerIcon } from '../../../components/icons/Conditioner';
import { DishWasherIcon } from '../../../components/icons/Dishwasher';
import { WashingMachineIcon } from '../../../components/icons/WashingMachine';
import { OtherIcon } from '../../../components/icons/Other';
import { KettleIcon } from '../../../components/icons/Kettle';
import { MicrowaweIcon } from '../../../components/icons/Microwawe';

// Компонент модалки
import { DecisionModal } from '../../../components/DecisionModal/DecisionModal';

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

export default function DevicesPage() {
  const { t } = useTranslation(); // Ініціалізуємо переклад

  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Усі');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const [deviceToDelete, setDeviceToDelete] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDevices(data.map((d: any) => ({
            id: d.id,
            name: d.model_name,
            category: d.category,
            power_watt: d.power_watts,
            startup_power_watt: d.startup_current_watts ?? null,
            tag: d.tag,
            iconName: categoryToIcon[d.category] ?? 'other',
          })));
        }
      })
      .catch((err) => console.error(t.common.error, err))
      .finally(() => setIsLoading(false));
  }, [t.common.error]);

  const filteredDevices = devices.filter((device) => {
    if (activeFilter === 'Усі') return true;
    return device.tag === activeFilter || device.tag === 'Усі'; 
  });

  const groupedDevices = filteredDevices.reduce((acc, device) => {
    const cat = device.category || 'Інше';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(device);
    return acc;
  }, {} as Record<string, any[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleToggleLocation = async (id: number, newTag: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, tag: newTag } : d));
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ tag: newTag }) 
      });
    } catch (err) { console.error(err); }
  };

  const confirmDelete = async () => {
    if (deviceToDelete === null) return;
    
    const id = deviceToDelete;
    setDevices(prev => prev.filter(d => d.id !== id));
    setDeviceToDelete(null); 

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) { 
      console.error(err);
    }
  };

  return (
    <div className="global-page-wrap">
      {/* 1. Глобальний заголовок */}
      <h1 className="page-title">{t.devices.title}</h1>
      
      {/* 2. Контейнер з фільтрами та підсумком */}
      <div className={styles['header-container']}>
        <div className={styles['top-section']}>
          
          <div className={styles['filters']}>
            <button 
              className={`${styles['filter-chip']} ${activeFilter === 'Усі' ? styles['active'] : ''}`}
              onClick={() => setActiveFilter('Усі')}
            >
              {t.common.all}
            </button>
            <button 
              className={`${styles['filter-chip']} ${styles['icon-chip']} ${activeFilter === 'Дім' ? styles['active'] : ''}`}
              onClick={() => setActiveFilter('Дім')}
            >
              <HomeIcon className={styles['filter-icon']} />
            </button>
            <button 
              className={`${styles['filter-chip']} ${styles['icon-chip']} ${activeFilter === 'Офіс' ? styles['active'] : ''}`}
              onClick={() => setActiveFilter('Офіс')}
            >
              <OfficeIcon className={styles['filter-icon']} />
            </button>
          </div>

          <Link href="/devices/add" className={styles['add-btn']}>
            <span className={styles['plus-icon']}>+</span>
            {t.common.add}
          </Link>
        </div>

        <div className={styles['summary-card']}>
          <div className={styles['summary-label']}>{t.devices.totalPower}</div>
          <div className={styles['summary-value']}>
            <span className={styles['accent']}>
              {filteredDevices.reduce((acc, d) => acc + (d.power_watt || 0), 0)}
            </span> {t.common.w} 
            {filteredDevices.some(d => d.startup_power_watt) && (
              <>
                , {t.devices.startup} <span className={styles['accent']}>
                  {Math.max(...filteredDevices.map(d => d.startup_power_watt || d.power_watt || 0), 0)}
                </span> {t.common.w}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Список приладів */}
      <div className={styles['device-list']}>
        {isLoading ? (
          <p style={{ color: 'var(--text-main)', fontWeight: 500 }}>{t.devices.loadingDevices}</p>
        ) : Object.keys(groupedDevices).length > 0 ? (
          Object.entries(groupedDevices).map(([categoryName, items]: [string, any[]]) => (
            <div key={categoryName} className={styles['category-group']}>
              <div 
                className={`${styles['category-header']} ${expandedCategories[categoryName] ? styles['expanded'] : ''}`} 
                onClick={() => toggleCategory(categoryName)}
              >
                <div className={styles['category-header-left']}>
                  <span className={styles['device-icon']}>
                    {renderDeviceIcon(categoryToIcon[categoryName] || 'other')}
                  </span>
                  <span className={styles['category-title']}>{categoryName}</span>
                </div>
                <ArrowIcon 
                  className={`${styles['arrow-icon']} ${expandedCategories[categoryName] ? styles['arrow-up'] : ''}`} 
                />
              </div>

              {expandedCategories[categoryName] && (
                <div className={styles['dropdown-container']}>
                  <div className={styles['dropdown-scroll']}>
                    {items.map((device: any) => (
                      <div key={device.id} className={styles['dropdown-item']}>
                        <div className={styles['item-name']}>{device.name}</div>
                        
                        <div className={styles['item-controls']}>
                          <span className={styles['item-power']}>
                            {device.power_watt} {t.common.w} {device.startup_power_watt ? `- ${t.devices.startup} ${device.startup_power_watt} ${t.common.w}` : ''}
                          </span>
                          
                          <div className={styles['action-group']}>
                            <button
                              className={`${styles['action-btn']} ${device.tag === 'Дім' ? styles['active'] : ''}`}
                              onClick={(e) => { e.stopPropagation(); handleToggleLocation(device.id, 'Дім'); }}
                            >
                              <HomeIcon className={styles['action-icon']} />
                              {t.common.home}
                            </button>
                            <button
                              className={`${styles['action-btn']} ${device.tag === 'Офіс' ? styles['active'] : ''}`}
                              onClick={(e) => { e.stopPropagation(); handleToggleLocation(device.id, 'Офіс'); }}
                            >
                              <OfficeIcon className={styles['action-icon']} />
                              {t.common.office}
                            </button>
                            <button
                              className={`${styles['action-btn']} ${styles['delete-btn']}`}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setDeviceToDelete(device.id); 
                              }}
                            >
                              <DeleteIcon className={styles['action-icon']} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
            {activeFilter === 'Усі' 
              ? t.devices.noDevicesAdded 
              : `${t.devices.noDevicesInCategory} "${activeFilter === 'Дім' ? t.common.home : t.common.office}".`}
          </p>
        )}
      </div>

      <DecisionModal 
        isOpen={deviceToDelete !== null}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={confirmDelete}
        title={t.common.areYouSure}
        confirmText={t.common.yes}
        cancelText={t.common.no}
      />
    </div>
  );
}