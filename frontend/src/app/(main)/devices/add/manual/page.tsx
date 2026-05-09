'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

// ПІДКЛЮЧАЄМО СЛОВНИК
import { useTranslation } from '../../../../../context/LanguageContext';

const CATEGORIES = [
  'Холодильник', 'Телевізор', 'Пральна машина', 'Мікрохвильовка',
  'Кондиціонер', 'Ноутбук', 'Роутер', 'Освітлення', 'Зарядний пристрій',
  'Посудомийна машина', 'Електрочайник', 'Кавоварка', 'Інше',
];

const API = process.env.NEXT_PUBLIC_API_URL;

// Іконка-стрілочка для випадаючого списку
const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ManualAddDevicePage() {
  const router = useRouter();
  const { t } = useTranslation(); // Ініціалізуємо переклад

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    power: '',
    startupPower: '',
  });

  const [searching, setSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', category: '', power: '' });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showStartupPower, setShowStartupPower] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validate = () => {
    const errors = { name: '', category: '', power: '' };
    if (!formData.name.trim()) errors.name = t.deviceManual.nameError;
    else if (/^\d+$/.test(formData.name.trim())) errors.name = t.deviceManual.nameNumError;
    
    if (!formData.category) errors.category = t.deviceManual.catError;
    
    if (!formData.power) errors.power = t.deviceManual.powerError;
    else if (isNaN(Number(formData.power))) errors.power = t.deviceManual.powerNumError;
    else if (Number(formData.power) <= 0) errors.power = t.deviceManual.powerZeroError;
    
    setFieldErrors(errors);
    return !errors.name && !errors.category && !errors.power;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
    setFieldErrors((prev) => ({ ...prev, category: '' }));
    setIsDropdownOpen(false);
  };

  const handleSearch = async () => {
    if (!formData.name.trim()) return;
    setError('');
    setSearching(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API}/devices/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model_name: formData.name.trim() }),
      });

      const data = await res.json();

      if (res.status === 422) {
        setError(data.detail || t.deviceManual.notAppliance);
        return;
      }
      if (!res.ok) {
        setError(t.deviceManual.searchError);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        category: data.category || '',
        power: String(data.power_watts || ''),
        startupPower: data.startup_current_watts ? String(Math.round(data.startup_current_watts)) : '',
      }));

      if (data.startup_current_watts) {
        setShowStartupPower(true);
      }

    } catch {
      setError(t.common.networkError);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model_name: formData.name.trim(),
          category: formData.category,
          power_watts: Number(formData.power),
          startup_current_watts: (showStartupPower && formData.startupPower) ? Number(formData.startupPower) : null,
          daily_usage_hours: 1,
          is_critical: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || t.common.error);
        return;
      }

      router.push('/devices');
    } catch {
      setError(t.common.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{t.deviceManual.title}</h1>

      <form onSubmit={handleSubmit} className={styles['form']}>
        {/* Назва приладу */}
        <div className={styles['input-group']}>
          <label htmlFor="name" className={styles['label']}>{t.deviceManual.deviceName}</label>
          <div className={styles['search-row']}>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder={t.deviceManual.namePlaceholder}
              className={styles['input']}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !formData.name.trim()}
              className={styles['search-btn']}
            >
              {searching ? t.common.searching : t.common.search}
            </button>
          </div>
          {fieldErrors.name && <p className={styles['error']}>{fieldErrors.name}</p>}
          {error && <p className={styles['error']}>{error}</p>}
        </div>

        {/* Категорія */}
        <div className={styles['input-group']} ref={dropdownRef}>
          <label className={styles['label']}>{t.deviceManual.category}</label>
          <div className={styles['custom-select-container']}>
            <div
              className={`${styles['input']} ${styles['custom-select-trigger']} ${!formData.category ? styles['placeholder'] : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{formData.category || t.deviceManual.chooseCategory}</span>
              <ArrowIcon className={`${styles['arrow-icon']} ${isDropdownOpen ? styles['arrow-up'] : ''}`} />
            </div>

            {isDropdownOpen && (
              <div className={styles['custom-select-dropdown']}>
                {CATEGORIES.map((c) => (
                  <div
                    key={c}
                    className={`${styles['custom-select-item']} ${formData.category === c ? styles['selected'] : ''}`}
                    onClick={() => handleCategorySelect(c)}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
          {fieldErrors.category && <p className={styles['error']}>{fieldErrors.category}</p>}
        </div>

        {/* Потужність */}
        <div className={styles['input-group']}>
          <label htmlFor="power" className={styles['label']}>{t.deviceManual.powerW}</label>
          <input
            type="number"
            id="power"
            name="power"
            value={formData.power}
            onChange={handleChange}
            placeholder="150"
            className={styles['input']}
          />
          {fieldErrors.power && <p className={styles['error']}>{fieldErrors.power}</p>}
        </div>

        {/* Пусковий струм */}
        {showStartupPower ? (
          <div className={styles['input-group']}>
            <div className={styles['startup-header']}>
              <label htmlFor="startupPower" className={styles['label']}>{t.deviceManual.startupW}</label>
              <button 
                type="button" 
                className={styles['remove-startup-btn']}
                onClick={() => {
                  setShowStartupPower(false);
                  setFormData(prev => ({ ...prev, startupPower: '' }));
                }}
              >
                {t.deviceManual.hide}
              </button>
            </div>
            <input
              type="number"
              id="startupPower"
              name="startupPower"
              value={formData.startupPower}
              onChange={handleChange}
              placeholder="Авто * 3.5"
              className={styles['input']}
            />
          </div>
        ) : (
          <button 
            type="button" 
            className={styles['add-startup-btn']}
            onClick={() => setShowStartupPower(true)}
          >
            {t.deviceManual.addStartup}
          </button>
        )}

        <button
          type="submit"
          className={styles['submit-btn']}
          disabled={isLoading}
        >
          {isLoading ? t.common.saving : t.common.save}
        </button>
      </form>
    </div>
  );
}