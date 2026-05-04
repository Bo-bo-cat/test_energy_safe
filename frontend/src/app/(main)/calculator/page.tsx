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
    default: return <div className={styles['device-svg']} style={{ backgroundColor: 'var(--border-color)', borderRadius: '4px' }} />;
  }
};

export default function CalculatorPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Стан фільтрів
  const [activeLocation, setActiveLocation] = useState('Усі');
  const [activeCategory, setActiveCategory] = useState<string | null>(null); // За замовчуванням нічого не обрано

  // Стан вибору
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);

  // Результати калькуляції з бекенду
  const [calcResult, setCalcResult] = useState<{
    totalPowerWatts: number;
    loadPercent: number;
    autonomyHours: number;
  } | null>(null);

  // 1. Завантаження даних приладів та систем
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, { headers: { Authorization: `Bearer ${token}` } }),
      // ВАЖЛИВО: Змінили на /systems/my, як у твоєму файлі picker
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/systems/my`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([resDevices, resSystems]) => {
        const dataDevices = await resDevices.json();
        const dataSystems = await resSystems.json();
        
        const devicesArray = Array.isArray(dataDevices) ? dataDevices : (dataDevices.data || []);
        const systemsArray = Array.isArray(dataSystems) ? dataSystems : (dataSystems.data || []);
        
        setDevices(devicesArray);
        setSystems(systemsArray);

        // Автоматично обираємо першу систему, якщо вона є
        if (systemsArray.length > 0) {
          setSelectedSystemId(systemsArray[0].id || systemsArray[0]._id);
        }
      })
      .catch(err => console.error("Помилка завантаження даних:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // 2. Виклик бекенд-калькулятора
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
        if (!res.ok) throw new Error('Помилка калькуляції');
        return res.json();
      })
      .then(data => {
        setCalcResult(data);
      })
      .catch(err => {
        console.error('Помилка при розрахунку:', err);
        setCalcResult(null);
      });
  }, [selectedDeviceIds, selectedSystemId]);

  // ВАЖЛИВО: Фільтрація приладів (показуємо ТІЛЬКИ якщо обрана категорія)
  const filteredDevices = activeCategory ? devices.filter(d => {
    const passLocation = activeLocation === 'Усі' || d.tag === activeLocation || d.tag === 'Усі';
    const passCategory = categoryToIcon[d.category] === activeCategory;
    return passLocation && passCategory;
  }) : [];

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds(prev => 
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    );
  };

  const toggleCategory = (cat: string) => {
    // Якщо клікаємо на вже активну категорію - знімаємо виділення
    setActiveCategory(prev => prev === cat ? null : cat);
  };

  // Знаходимо обрану систему для правої панелі
  const selectedSystem = systems.find(s => String(s.id || s._id) === String(selectedSystemId));
  
  // Витягуємо назву з поля model (як у твоєму picker)
  const systemDisplayName = selectedSystem 
    ? (selectedSystem.model || selectedSystem.type || 'Модель')
    : 'Оберіть';

  // Кольори для прогрес-бару
  const loadPercentage = calcResult?.loadPercent || 0;
  const progressWidth = Math.min(loadPercentage, 100);
  let progressColor = '#34C759'; 
  if (loadPercentage > 80) progressColor = '#FF9500'; 
  if (loadPercentage > 100) progressColor = '#FF2D55'; 

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Розрахунок</h1>

      <div className={styles.layout}>
        {/* ЛІВА ЧАСТИНА */}
        <div className={styles['main-content']}>
          
          <div className={styles['filters-row']}>
            {['Усі', 'Дім', 'Офіс'].map(loc => (
              <div 
                key={loc}
                className={`${styles['filter-chip']} ${activeLocation === loc ? styles.active : ''}`}
                onClick={() => setActiveLocation(loc)}
              >
                {loc}
              </div>
            ))}
          </div>

          <div className={styles['icon-filters']}>
            {['fridge', 'laptop', 'router', 'light', 'tv'].map(icon => (
              <div 
                key={icon}
                className={`${styles['icon-chip']} ${activeCategory === icon ? styles.active : ''}`}
                onClick={() => toggleCategory(icon)}
              >
                {renderDeviceIcon(icon)}
              </div>
            ))}
          </div>

          {/* Список приладів */}
          <div className={styles['device-list']}>
            {!activeCategory ? (
              <p style={{ color: 'var(--text-muted)' }}>Оберіть категорію вище, щоб побачити прилади.</p>
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
                      {device.power_watts || device.power_watt} Вт {device.startup_current_watts ? `- пуск ${device.startup_current_watts} Вт` : ''}
                    </div>
                  </div>
                )
              })
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>У цій категорії ще немає приладів.</p>
            )}
          </div>

          {/* Сітка Систем */}
          <div className={styles['systems-grid']}>
            <Link href="/picker" className={`${styles['system-card']} ${styles['add-system-card']}`} style={{ textDecoration: 'none' }}>
              <span className={styles['add-icon']}>+</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Додати мою ДБЖ</span>
            </Link>

            {systems.map(sys => {
              const id = sys.id || sys._id;
              const isSelected = selectedSystemId === id;
              // Використовуємо sys.model як у твоєму бекенді
              const sysName = sys.model || 'Модель';
              
              return (
                <div 
                  key={id} 
                  className={`${styles['system-card']} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelectedSystemId(id)}
                >
                  <div className={styles['system-title']}>{sys.type || 'ДБЖ'} - {sysName}</div>
                  
                  <div className={styles['system-spec']}>
                    <span className={styles['spec-label']}>Тип</span>
                    <span className={styles['spec-value']}>{sys.type || 'Електростанція'}</span>
                  </div>
                  <div className={styles['system-spec']}>
                    <span className={styles['spec-label']}>Потужність</span>
                    <span className={styles['spec-value']}>{sys.power} Вт</span>
                  </div>
                  <div className={styles['system-spec']}>
                    <span className={styles['spec-label']}>Батарея</span>
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
            ДБЖ - [{systemDisplayName}]
          </div>

          <div className={styles['stats-grid']}>
            <div className={styles['stat-box']}>
              <div className={styles['stat-value']}>
                {calcResult ? calcResult.totalPowerWatts : '0'}
              </div>
              <div className={styles['stat-label']}>Вт сумарно</div>
            </div>

            <div className={styles['stat-box']}>
              <div className={`${styles['stat-value']} ${loadPercentage > 100 ? styles.error : ''}`}>
                {calcResult ? calcResult.loadPercent : '0'}%
              </div>
              <div className={styles['stat-label']}>Від інвертора</div>
            </div>

            <div className={styles['stat-box']}>
              <div className={styles['stat-value']}>
                {calcResult ? calcResult.autonomyHours : '0'}
              </div>
              <div className={styles['stat-label']}>Автономія, Год</div>
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
            onClick={() => alert("Функція збереження сценарію буде додана пізніше!")}
          >
            {loadPercentage > 100 ? 'Перевантаження' : 'Зберегти сценаріо'}
          </button>
        </div>

      </div>
    </div>
  );
}