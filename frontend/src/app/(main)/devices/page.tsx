'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import toast from 'react-hot-toast';

// Іконки
import { FridgeIcon } from '../../../components/icons/Fridge';
import { LaptopIcon } from '../../../components/icons/Laptop';
import { RouterIcon } from '../../../components/icons/Router';
import { LightIcon } from '../../../components/icons/Light';
import { TvIcon } from '../../../components/icons/Tv';
import { ArrowIcon } from '../../../components/icons/Arrow';
import { DeleteIcon } from '../../../components/icons/Delete';
import { CoffeeMachineIcon } from '../../../components/icons/Coffee_Machine';
import { ChargerIcon } from '../../../components/icons/Charger';
import { ConditionerIcon } from '../../../components/icons/Conditioner';
import { DishWasherIcon } from '../../../components/icons/Dishwasher';
import { WashingMachineIcon } from '../../../components/icons/WashingMachine';
import { OtherIcon } from '../../../components/icons/Other';
import { KettleIcon } from '../../../components/icons/Kettle';
import { MicrowaweIcon } from '../../../components/icons/Microwawe';

// Компоненти
import { DecisionModal } from '../../../components/DecisionModal/DecisionModal';
import { AnimatedEmptyIcon } from '../../../components/AnimatedEmptyIcon/AnimatedEmptyIcon'; 
import { AddDeviceModal } from '../../../components/AddDeviceModal/AddDeviceModal'; // Наша модалка

// Словник
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

const DEFAULT_LOCATIONS = ['Дім', 'Офіс'];

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
  const { t, lang } = useTranslation(); 

  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Усі');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [deviceToDelete, setDeviceToDelete] = useState<number | null>(null);
  
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [customLocations, setCustomLocations] = useState<string[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const newLocationInputRef = useRef<HTMLInputElement>(null);

  // СТАН ДЛЯ МОДАЛКИ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`.${styles['custom-select-container']}`)) {
        return; 
      }
      setOpenDropdownId(null); 
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      .catch((err) => {
        console.error(t.common.error, err);
        toast.error(lang === 'uk' ? 'Помилка завантаження приладів' : 'Error loading devices');
      })
      .finally(() => setIsLoading(false));
  }, [t.common.error, lang]);

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

  const allLocations = [...DEFAULT_LOCATIONS, ...customLocations];

  const handleAddLocation = async () => {
    const name = newLocationName.trim();
    setShowAddLocation(false);
    setNewLocationName('');
    if (!name || allLocations.includes(name)) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (Array.isArray(data.locations)) {
        setCustomLocations(data.locations);
        toast.success(lang === 'uk' ? `Локацію "${name}" додано` : `Location "${name}" added`);
      }
    } catch { 
      toast.error(lang === 'uk' ? 'Не вдалося додати локацію' : 'Failed to add location');
    }
  };

  const handleDeleteLocation = async (name: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/locations/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomLocations(prev => prev.filter(l => l !== name));
      if (activeFilter === name) setActiveFilter('Усі');
      toast.success(lang === 'uk' ? 'Локацію видалено' : 'Location deleted');
    } catch { 
      toast.error(lang === 'uk' ? 'Помилка видалення локації' : 'Error deleting location');
    }
  };

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
      toast.success(lang === 'uk' ? 'Локацію приладу змінено' : 'Device location changed');
    } catch (err) { 
      console.error(err); 
      toast.error(lang === 'uk' ? 'Помилка зміни локації' : 'Error changing location');
    }
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
      toast.success(lang === 'uk' ? 'Прилад видалено' : 'Device deleted');
    } catch (err) { 
      console.error(err);
      toast.error(lang === 'uk' ? 'Помилка видалення приладу' : 'Error deleting device');
    }
  };

  const hasDevices = devices.length > 0;

  return (
    <div 
      className="global-page-wrap" 
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      <h1 className="page-title">{t.devices.title}</h1>
      
      <div className={styles['header-container']}>
        <div className={styles['top-section']}>
          
          <div className={styles['filters']}>
            <button
              className={`${styles['filter-chip']} ${styles['flex-chip']} ${activeFilter === 'Усі' ? styles['active'] : ''}`}
              onClick={() => setActiveFilter('Усі')}
            >
              {t.common.all}
            </button>
            {allLocations.map(loc => (
              <div
                key={loc}
                className={`${styles['filter-chip']} ${styles['flex-chip']} ${activeFilter === loc ? styles['active'] : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                onClick={() => setActiveFilter(loc)}
              >
                <span>{loc}</span>
                {!DEFAULT_LOCATIONS.includes(loc) && (
                  <span
                    style={{ fontSize: '14px', lineHeight: 1, opacity: 0.6 }}
                    onClick={e => { e.stopPropagation(); handleDeleteLocation(loc); }}
                  >
                    ×
                  </span>
                )}
              </div>
            ))}
            {showAddLocation ? (
              <input
                ref={newLocationInputRef}
                autoFocus
                value={newLocationName}
                onChange={e => setNewLocationName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddLocation();
                  if (e.key === 'Escape') { setShowAddLocation(false); setNewLocationName(''); }
                }}
                onBlur={handleAddLocation}
                placeholder={t.devices.locationPlaceholder || "Нова локація"}
                className={styles['location-input']}
                maxLength={20}
              />
            ) : (
              <button
                className={`${styles['filter-chip']} ${styles['icon-chip']}`}
                onClick={() => setShowAddLocation(true)}
                title={t.devices.addLocation || "Додати локацію"}
              >
                +
              </button>
            )}
          </div>

          {hasDevices && (
            <button onClick={() => setIsAddModalOpen(true)} className={styles['add-btn']}>
              <span className={styles['plus-icon']}>+</span>
              {t.common.add}
            </button>
          )}
        </div>

        {hasDevices && (
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
        )}
      </div>

      <div className={styles['device-list']} style={{ flex: 1, overflowY: 'auto', paddingBottom: '32px' }}>
        {isLoading ? (
          <p style={{ color: 'var(--text-main)', fontWeight: 500 }}>{t.devices.loadingDevices}</p>
        ) : Object.keys(groupedDevices).length > 0 ? (
          Object.entries(groupedDevices).map(([categoryName, items]: [string, any[]]) => (
            <div 
              key={categoryName} 
              className={styles['category-group']}
              style={{ position: 'relative', zIndex: items.some((d: any) => openDropdownId === d.id) ? 50 : 1 }}
            >
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
                            
                            <div className={styles['custom-select-container']}>
                              <div 
                                className={`${styles['location-select']} ${openDropdownId === device.id ? styles['active-select'] : ''}`}
                                onClick={() => setOpenDropdownId(openDropdownId === device.id ? null : device.id)}
                              >
                                {device.tag || allLocations[0]}
                              </div>
                              
                              {openDropdownId === device.id && (
                                <div className={styles['custom-select-dropdown']}>
                                  {allLocations.map(loc => (
                                    <div
                                      key={loc}
                                      className={`${styles['custom-select-item']} ${device.tag === loc ? styles['selected'] : ''}`}
                                      onClick={() => {
                                        handleToggleLocation(device.id, loc);
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      {loc}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <button
                              className={`${styles['action-btn']} ${styles['delete-btn']}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeviceToDelete(device.id);
                              }}
                              title={t.common.delete || "Видалити"}
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
          <div className={styles['empty-state']}>
            <AnimatedEmptyIcon />
            <h3 className={styles['empty-title']}>
              {activeFilter === 'Усі' 
                ? (lang === 'uk' ? 'Немає приладів' : 'No devices found') 
                : (lang === 'uk' ? `Немає приладів у локації "${activeFilter}"` : `No devices in "${activeFilter}"`)}
            </h3>
            <p className={styles['empty-desc']}>
              {activeFilter === 'Усі' 
                ? (lang === 'uk' ? 'Ваш список приладів порожній. Додайте перший прилад, щоб мати можливість розраховувати навантаження.' : 'Your device list is empty. Add your first device to start calculating loads.')
                : (lang === 'uk' ? 'У цій локації ще немає жодного приладу. Додайте новий або змініть локацію для існуючих.' : 'There are no devices in this location yet. Add a new one or change the location of existing devices.')}
            </p>
            {activeFilter === 'Усі' && (
              <button onClick={() => setIsAddModalOpen(true)} className={styles['empty-btn']}>
                {lang === 'uk' ? 'Додати прилад' : 'Add device'}
              </button>
            )}
          </div>
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

      {/* РЕНДЕР МОДАЛКИ ДЛЯ ДОДАВАННЯ ПРИЛАДУ */}
      <AddDeviceModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}