'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

// ПІДКЛЮЧАЄМО СЛОВНИК
import { useTranslation } from '../../../../context/LanguageContext';

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

const STARTUP_CATEGORIES = ['Холодильник', 'Пральна машина', 'Кондиціонер', 'Посудомийна машина'];

function ManualAddDeviceContent() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const params = useSearchParams();

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
  const [startupError, setStartupError] = useState('');

  useEffect(() => {
    const name = params.get('name');
    const power = params.get('power');
    const category = params.get('category');
    const startup = params.get('startup');
    if (name || power || category) {
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        power: power || prev.power,
        category: category || prev.category,
        startupPower: startup || prev.startupPower,
      }));
      if (category && STARTUP_CATEGORIES.includes(category)) {
        setShowStartupPower(true);
      }
    }
  }, []);

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

    let startupErr = '';
    if (showStartupPower && formData.startupPower && formData.power) {
      if (Number(formData.startupPower) < Number(formData.power)) {
        startupErr = t.deviceManual.startupLessThanPower;
      }
    }
    setStartupError(startupErr);

    setFieldErrors(errors);
    return !errors.name && !errors.category && !errors.power && !startupErr;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const STARTUP_CATEGORIES = ['Холодильник', 'Пральна машина', 'Кондиціонер', 'Посудомийна машина'];

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
    setFieldErrors((prev) => ({ ...prev, category: '' }));
    setIsDropdownOpen(false);
    if (STARTUP_CATEGORIES.includes(category)) setShowStartupPower(true);
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

  const showHint = !formData.name.trim() || !formData.category || !formData.power;

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{t.deviceManual.title}</h1>

      <form onSubmit={handleSubmit} className={styles['form']}>
        {/* Назва приладу */}
        <div className={styles['input-group']}>
          <label htmlFor="name" className={styles['label']}>{t.deviceManual.deviceName}</label>
          
          {showHint && (
            <div className={styles['info-box']}>
              <svg className={styles['info-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p className={styles['info-text']}>
                {lang === 'uk' 
                  ? "Введіть модель або серійний номер приладу та натисніть «Знайти», щоб система автоматично визначила характеристики."
                  : "Enter the model or serial number of the device and press 'Search' for the system to automatically determine the characteristics."}
              </p>
            </div>
          )}

          {/* ДОДАНО: id="tour-smart-search" для підсвічування розумного пошуку */}
          <div className={styles['search-row']} id="tour-smart-search">
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
            {startupError && <p className={styles['error']}>{startupError}</p>}
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

export default function ManualAddDevicePage() {
  return (
    <Suspense>
      <ManualAddDeviceContent />
    </Suspense>
  );
}