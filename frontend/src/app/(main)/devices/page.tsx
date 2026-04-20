'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

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

  return (
    <div className={styles['wrap']}>
      
      {/* Шапка, Фільтри та Кнопка згруповані для CSS Grid */}
      <div className={styles['top-section']}>
        <h1 className={styles['title']}>Мої прилади</h1>
        
        <div className={styles['filters']}>
          <button className={styles['filter-chip']}>Усі</button>
          <button className={styles['filter-chip']}>Дім</button>
          <button className={styles['filter-chip']}>Офіс</button>
        </div>

        <button className={styles['add-btn']} type="button">
          <span className={styles['plus-icon']}>+</span>
          Додати
        </button>
      </div>

      {/* Список приладів */}
      <div className={styles['device-list']}>
        {devices.map((device) => {
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

      {/* Картка загальної потужності */}
      <div className={styles['summary-card']}>
        <div className={styles['summary-label']}>Загальна потужність</div>
        <div className={styles['summary-value']}>
          <span className={styles['accent']}>
            {devices.reduce((acc, d) => acc + (d.power_watt || 0), 0)}
          </span> Вт 
          {devices.some(d => d.startup_power_watt) && (
            <>
              , пуск <span className={styles['accent']}>
                {Math.max(...devices.map(d => d.startup_power_watt || d.power_watt || 0), 0)}
              </span> Вт
            </>
          )}
        </div>
      </div>

    </div>
  );
}