'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

import { FridgeIcon } from '../../../components/icons/Fridge';
import { LaptopIcon } from '../../../components/icons/Laptop';
import { RouterIcon } from '../../../components/icons/Router';
import { LightIcon } from '../../../components/icons/Light';
import { TvIcon } from '../../../components/icons/Tv';
import { ArrowIcon } from '../../../components/icons/Arrow';
import { DeleteIcon } from '../../../components/icons/Delete';
import { HomeIcon } from '../../../components/icons/Home';
import { OfficeIcon } from '../../../components/icons/Office';

const categoryToIcon: Record<string, string> = {
  'Холодильник': 'fridge', 
  'Ноутбук': 'laptop', 
  'Роутер': 'router',
  'Освітлення': 'light', 
  'Телевізор': 'tv',
};

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
  // Починаємо з порожнього списку
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Усі');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
      .catch((err) => console.error('Помилка завантаження:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredDevices = devices.filter((device) => {
    if (activeFilter === 'Усі') return true;
    return device.tag === activeFilter;
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

  const handleDelete = async (id: number) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) { console.error(err); }
  };

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
          Додати
        </Link>
      </div>

      <div className={styles['device-list']}>
        {isLoading ? (
          <p style={{ color: '#1A1A1A', fontWeight: 500 }}>Завантаження приладів...</p>
        ) : Object.keys(groupedDevices).length > 0 ? (
          Object.entries(groupedDevices).map(([categoryName, items]: [string, any[]]) => (
            <div key={categoryName} className={styles['category-group']}>
              <div 
                className={styles['category-header']} 
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
                            {device.power_watt} Вт {device.startup_power_watt ? `- пуск ${device.startup_power_watt} Вт` : ''}
                          </span>
                          
                          <div className={styles['action-group']}>
                            <button
                              className={`${styles['action-btn']} ${device.tag === 'Дім' ? styles['active'] : ''}`}
                              onClick={(e) => { e.stopPropagation(); handleToggleLocation(device.id, 'Дім'); }}
                            >
                              <HomeIcon className={styles['action-icon']} />
                              Дім
                            </button>
                            <button
                              className={`${styles['action-btn']} ${device.tag === 'Офіс' ? styles['active'] : ''}`}
                              onClick={(e) => { e.stopPropagation(); handleToggleLocation(device.id, 'Офіс'); }}
                            >
                              <OfficeIcon className={styles['action-icon']} />
                              Офіс
                            </button>
                            <button
                              className={`${styles['action-btn']} ${styles['delete-btn']}`}
                              onClick={(e) => { e.stopPropagation(); handleDelete(device.id); }}
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
          <p style={{ color: '#A0A0A0', fontWeight: 500 }}>
            {activeFilter === 'Усі' ? 'У вас ще немає доданих приладів.' : `Немає приладів у категорії "${activeFilter}".`}
          </p>
        )}
      </div>

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