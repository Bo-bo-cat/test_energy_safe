'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const CATEGORIES = [
  'Холодильник', 'Телевізор', 'Пральна машина', 'Мікрохвильовка',
  'Кондиціонер', 'Ноутбук', 'Роутер', 'Освітлення', 'Зарядний пристрій',
  'Посудомийна машина', 'Електрочайник', 'Кавоварка', 'Інше',
];

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ManualAddDevicePage() {
  const router = useRouter();

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

  const validate = () => {
    const errors = { name: '', category: '', power: '' };
    if (!formData.name.trim()) errors.name = 'Введіть назву приладу';
    else if (/^\d+$/.test(formData.name.trim())) errors.name = 'Назва приладу не може бути числом';
    if (!formData.category) errors.category = 'Оберіть категорію';
    if (!formData.power) errors.power = 'Введіть потужність';
    else if (isNaN(Number(formData.power))) errors.power = 'Потужність має бути числом';
    else if (Number(formData.power) <= 0) errors.power = 'Потужність має бути більше 0';
    setFieldErrors(errors);
    return !errors.name && !errors.category && !errors.power;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
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
        setError(data.detail || 'Це не схоже на побутовий електроприлад');
        return;
      }
      if (!res.ok) {
        setError('Помилка пошуку. Спробуйте ще раз');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        category: data.category || '',
        power: String(data.power_watts || ''),
        startupPower: data.startup_current_watts ? String(Math.round(data.startup_current_watts)) : '',
      }));
    } catch {
      setError('Помилка мережі');
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
          startup_current_watts: formData.startupPower ? Number(formData.startupPower) : null,
          daily_usage_hours: 1,
          is_critical: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Помилка збереження');
        return;
      }

      router.push('/devices');
    } catch {
      setError('Помилка мережі');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles['page-wrapper']}>
      <h1 className={styles['title']}>Ввести вручну</h1>

      <form onSubmit={handleSubmit} className={styles['form']}>
        {/* Назва приладу */}
        <div className={styles['input-group']}>
          <label htmlFor="name" className={styles['label']}>Назва приладу</label>
          <div className={styles['search-row']}>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder="Наприклад: Gorenje RK4182PW4"
              className={styles['input']}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !formData.name.trim()}
              className={styles['search-btn']}
            >
              {searching ? 'Пошук...' : 'Знайти'}
            </button>
          </div>
          {fieldErrors.name && <p className={styles['error']}>{fieldErrors.name}</p>}
          {error && <p className={styles['error']}>{error}</p>}
        </div>

        {/* Категорія */}
        <div className={styles['input-group']}>
          <label htmlFor="category" className={styles['label']}>Категорія</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`${styles['input']} ${styles['select']}`}
          >
            <option value="" disabled hidden>Оберіть категорію</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {fieldErrors.category && <p className={styles['error']}>{fieldErrors.category}</p>}
        </div>

        {/* Потужність */}
        <div className={styles['input-group']}>
          <label htmlFor="power" className={styles['label']}>Потужність (Вт)</label>
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
        <div className={styles['input-group']}>
          <label htmlFor="startupPower" className={styles['label']}>Пусковий струм (Вт)</label>
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

        {/* Кнопка */}
        <button
          type="submit"
          className={styles['submit-btn']}
          disabled={isLoading}
        >
          {isLoading ? 'Збереження...' : 'Зберегти'}
        </button>
      </form>
    </div>
  );
}
