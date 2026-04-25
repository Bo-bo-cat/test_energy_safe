'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

import { FridgeIcon } from '../../../components/icons/Fridge';
import { LaptopIcon } from '../../../components/icons/Laptop';
import { RouterIcon } from '../../../components/icons/Router';
import { LightIcon } from '../../../components/icons/Light';
import { TvIcon } from '../../../components/icons/Tv';

// Функція для відмальовки відповідної іконки
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

// Розумне визначення тегу "Дім" чи "Офіс" на основі категорії для фільтрів
const getLocationTag = (category: string) => {
  const officeCategories = ['Ноутбук', 'Роутер', 'Освітлення', 'Зарядний пристрій'];
  return officeCategories.includes(category) ? 'Офіс' : 'Дім';
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Стан завантаження
  const [activeFilter, setActiveFilter] = useState('Усі');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Словник для співставлення категорії з бази даних та назви іконки
    const categoryToIcon: Record<string, string> = {
      'Холодильник': 'fridge', 
      'Ноутбук': 'laptop', 
      'Роутер': 'router',
      'Освітлення': 'light', 
      'Телевізор': 'tv',
    };

    // Запит до вашої БД
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Мапимо дані з бази під наш інтерфейс
          setDevices(data.map((d: any) => ({
            id: d.id,
            name: d.model_name,
            power_watt: d.power_watts,
            startup_power_watt: d.startup_current_watts ?? null,
            tag: getLocationTag(d.category), // Автоматично присвоюємо Дім/Офіс
            iconName: categoryToIcon[d.category] ?? 'other', // Підбираємо іконку
          })));
        }
      })
      .catch((err) => console.error('Помилка завантаження:', err))
      .finally(() => setIsLoading(false)); // Вимикаємо лоадер після завантаження
  }, []);

  // Фільтрація приладів
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

      <div className={styles['device-list']}>
        {isLoading ? (
          <p style={{ color: '#1A1A1A', fontWeight: 500 }}>Завантаження приладів...</p>
        ) : filteredDevices.length > 0 ? (
          filteredDevices.map((device) => (
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
                <span className={styles['device-tag']}>{device.tag}</span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#A0A0A0', fontWeight: 500 }}>
            {activeFilter === 'Усі' ? 'У вас ще немає доданих приладів.' : `Немає приладів у категорії "${activeFilter}".`}
          </p>
        )}
      </div>

      {/* Картка загальної потужності (рахує тільки видимі прилади) */}
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