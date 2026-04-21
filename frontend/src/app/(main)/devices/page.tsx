'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

import { FridgeIcon } from '../../../components/icons/Fridge';
import { LaptopIcon } from '../../../components/icons/Laptop';
import { RouterIcon } from '../../../components/icons/Router';
import { LightIcon } from '../../../components/icons/Light';
import { TvIcon } from '../../../components/icons/Tv';

interface Device {
  id: string;
  model_name: string;
  brand: string;
  category: string;
  power_watts: number;
  daily_usage_hours: number;
  is_critical: boolean;
}

const categoryToIcon: Record<string, string> = {
  'Холодильник': 'fridge',
  'Ноутбук': 'laptop',
  'Роутер': 'router',
  'Освітлення': 'light',
  'Телевізор': 'tv',
};

const renderDeviceIcon = (category: string) => {
  const iconName = categoryToIcon[category] ?? '';
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
  const [devices, setDevices] = useState<Device[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [modelName, setModelName] = useState('');
  const [dailyHours, setDailyHours] = useState('1');
  const [isCritical, setIsCritical] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function getToken() {
    return localStorage.getItem('access_token') ?? '';
  }

  async function fetchDevices() {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setDevices(data);
    }
  }

  useEffect(() => { fetchDevices(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const name = modelName.trim();
    if (!name) { setError('Введіть назву моделі пристрою'); return; }

    const hours = parseFloat(dailyHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      setError('Кількість годин повинна бути від 0 до 24');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ model_name: name, daily_usage_hours: hours, is_critical: isCritical }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail ?? 'Помилка при додаванні пристрою');
        return;
      }

      setModelName('');
      setDailyHours('1');
      setIsCritical(false);
      setShowForm(false);
      await fetchDevices();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    await fetchDevices();
  }

  return (
    <div className={styles['wrap']}>

      <div className={styles['top-section']}>
        <h1 className={styles['title']}>Мої прилади</h1>

        <div className={styles['filters']}>
          <button className={styles['filter-chip']}>Усі</button>
          <button className={styles['filter-chip']}>Дім</button>
          <button className={styles['filter-chip']}>Офіс</button>
        </div>

        <button className={styles['add-btn']} type="button" onClick={() => { setShowForm(v => !v); setError(''); }}>
          <span className={styles['plus-icon']}>+</span>
          Додати
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className={styles['add-form']}>
          <input
            value={modelName}
            onChange={e => setModelName(e.target.value)}
            placeholder="Назва моделі (наприклад: Samsung RB34)"
            disabled={loading}
            required
          />
          <input
            type="number"
            value={dailyHours}
            onChange={e => setDailyHours(e.target.value)}
            placeholder="Годин/день"
            min="0"
            max="24"
            step="0.5"
            disabled={loading}
          />
          <label>
            <input
              type="checkbox"
              checked={isCritical}
              onChange={e => setIsCritical(e.target.checked)}
              disabled={loading}
            />
            {' '}Критичний
          </label>
          {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Пошук...' : 'Зберегти'}
          </button>
        </form>
      )}

      <div className={styles['device-list']}>
        {devices.map((device) => (
          <div key={device.id} className={styles['device-item']}>
            <div className={styles['device-left']}>
              <span className={styles['device-icon']}>
                {renderDeviceIcon(device.category)}
              </span>
              <span className={styles['device-name']}>{device.model_name}</span>
            </div>

            <div className={styles['device-right']}>
              <span className={styles['device-power']}>
                {device.power_watts} Вт
              </span>
              <span className={styles['device-tag']}>{device.category}</span>
              <button
                onClick={() => handleDelete(device.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 18 }}
                title="Видалити"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles['summary-card']}>
        <div className={styles['summary-label']}>Загальна потужність</div>
        <div className={styles['summary-value']}>
          <span className={styles['accent']}>
            {devices.reduce((acc, d) => acc + (d.power_watts || 0), 0)}
          </span> Вт
        </div>
      </div>

    </div>
  );
}
