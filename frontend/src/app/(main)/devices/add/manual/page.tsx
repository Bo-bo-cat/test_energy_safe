'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function ManualAddDevicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Стан для форми
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    power: '',
    startupPower: ''
  });

  // Обробник змін в інпутах
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Обробник відправки форми
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ⚠️ ТУТ МАЄ БУТИ ВАШ РОУТ АПІ (наприклад, /api/devices)
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          power: Number(formData.power),
          // Якщо пускова потужність не введена, передаємо null або 0
          startupPower: formData.startupPower ? Number(formData.startupPower) : null, 
        }),
      });

      if (response.ok) {
        // Успішно збережено — повертаємося до списку приладів
        router.push('/devices');
      } else {
        console.error('Помилка при збереженні приладу');
        // Тут можна додати вивід помилки для користувача
      }
    } catch (error) {
      console.error('Помилка мережі:', error);
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
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Наприклад: Холодильник Samsung"
            className={styles['input']}
            required
          />
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
            required
          >
            <option value="" disabled hidden>Оберіть категорії</option>
            <option value="fridge">Холодильник</option>
            <option value="router">Роутер</option>
            <option value="lighting">Освітлення</option>
            <option value="tv">Телевізор</option>
            <option value="other">Інше</option>
          </select>
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
            required
            min="1"
          />
        </div>

        {/* Пусковий струм (Необов'язково) */}
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
            min="1"
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