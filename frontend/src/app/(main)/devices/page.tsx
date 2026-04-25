'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

import { FridgeIcon } from '../../../components/icons/Fridge';
import { LaptopIcon } from '../../../components/icons/Laptop';
import { RouterIcon } from '../../../components/icons/Router';
import { LightIcon } from '../../../components/icons/Light';
import { TvIcon } from '../../../components/icons/Tv';

const initialDevices = [
  { id: 1, name: 'Холодильник', power_watt: 150, startup_power_watt: 600, tag: 'Дім', iconName: 'fridge' },
  { id: 2, name: 'Ноутбук', power_watt: 65, startup_power_watt: null, tag: 'Офіс', iconName: 'laptop' },
  { id: 3, name: 'Роутер', power_watt: 12, startup_power_watt: null, tag: 'Дім', iconName: 'router' },
  { id: 4, name: 'Лампи (4 шт.)', power_watt: 30, startup_power_watt: null, tag: 'Офіс', iconName: 'light' },
  { id: 5, name: 'Телевізор', power_watt: 120, startup_power_watt: null, tag: 'Дім', iconName: 'tv' },
];

const renderDeviceIcon = (iconName?: string) => {
  switch (iconName) {
    case 'fridge': return <FridgeIcon className={styles['device-svg']} />;
    case 'laptop': return <LaptopIcon className={styles['device-svg']} />;
    case 'router': return <RouterIcon className={styles['device-svg']} />;
    case 'light': return <LightIcon className={styles['device-svg']} />;
    case 'tv': return <TvIcon className={styles['device-svg']} />;
    default: return <div className={styles['device-svg']} style={{ backgroundColor: '#E0E0E0', borderRadius: '4px' }} />;
  }
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>(initialDevices);
  
  // Додаємо стан для збереження активного фільтра
  const [activeFilter, setActiveFilter] = useState('Усі');

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    // fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices?user_id=${userId}`)
    //   .then((r) => r.json())
    //   .then((data) => {
    //     if (Array.isArray(data) && data.length > 0) {
    //       setDevices(data);
    //     }
    //   })
    //   .catch((err) => console.error('Помилка завантаження:', err));
  }, []);

  // Відфільтрований масив приладів
  const filteredDevices = devices.filter((device) => {
    if (activeFilter === 'Усі') return true;
    return device.tag === activeFilter;
  });

  return (
    <div className={styles['wrap']}>
      
      <div className={styles['top-section']}>
        <h1 className={styles['title']}>Мої прилади</h1>
        
        <div className={styles['filters']}>
          <button 
            className={`${styles['filter-chip']} ${activeFilter === 'Усі' ? styles['active'] : ''}`}
            onClick={() => setActiveFilter('Усі')}
          >
            Усі
          </button>
          <button 
            className={`${styles['filter-chip']} ${activeFilter === 'Дім' ? styles['active'] : ''}`}
            onClick={() => setActiveFilter('Дім')}
          >
            Дім
          </button>
          <button 
            className={`${styles['filter-chip']} ${activeFilter === 'Офіс' ? styles['active'] : ''}`}
            onClick={() => setActiveFilter('Офіс')}
          >
            Офіс
          </button>
        </div>

        <Link href="/devices/add" className={styles['add-btn']}>
          <span className={styles['plus-icon']}>+</span>
          Додати
        </Link>
      </div>

      {/* Виводимо ВІДФІЛЬТРОВАНИЙ список приладів */}
      <div className={styles['device-list']}>
        {filteredDevices.map((device) => {
          return (
            <div key={device.id} className={styles['device-item']}>
              
              <div className={styles['device-left']}>
                <span className={styles['device-icon']}>
                  {renderDeviceIcon(device.iconName)}
                </span>
                <span className={styles['device-name']}>{device.name}</span>
              </div>

              <div className={styles['device-right']}>
                <span className={styles['device-power']}>
                  {device.power_watt} Вт {device.startup_power_watt ? `- пуск ${device.startup_power_watt} Вт` : ''}
                </span>
                <span className={styles['device-tag']}>{device.tag || 'Прилад'}</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Картка загальної потужності тепер рахує тільки видимі (відфільтровані) прилади */}
      <div className={styles['summary-card']}>
        <div className={styles['summary-label']}>Загальна потужність</div>
        <div className={styles['summary-value']}>
          <span className={styles['accent']}>
            {filteredDevices.reduce((acc, d) => acc + (d.power_watt || 0), 0)}
          </span> Вт 
          {filteredDevices.some(d => d.startup_power_watt) && (
            <>
              , пуск <span className={styles['accent']}>
                {Math.max(...filteredDevices.map(d => d.startup_power_watt || d.power_watt || 0), 0)}
              </span> Вт
            </>
          )}
        </div>
      </div>

    </div>
  );
}