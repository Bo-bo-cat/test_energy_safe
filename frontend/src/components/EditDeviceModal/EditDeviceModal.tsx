'use client';
import { useState, useEffect, FormEvent } from 'react';
import styles from './EditDeviceModal.module.css';
import toast from 'react-hot-toast';
import { useTranslation } from '../../context/LanguageContext';

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: any | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Холодильник', 'Телевізор', 'Пральна машина', 'Мікрохвильовка', 
  'Кондиціонер', 'Ноутбук', 'Роутер', 'Освітлення', 'Зарядний пристрій', 
  'Посудомийна машина', 'Електрочайник', 'Кавоварка', 'Інше'
];

export const EditDeviceModal = ({ isOpen, onClose, device, onSuccess }: EditDeviceModalProps) => {
  const { lang } = useTranslation();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [power, setPower] = useState('');
  const [startupPower, setStartupPower] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Захист від "стрибків" скролбара
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${parseFloat(originalPaddingRight) + scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Заповнюємо форму даними приладу при відкритті
  useEffect(() => {
    if (device && isOpen) {
      setName(device.name || '');
      setCategory(device.category || 'Інше');
      setPower(device.power_watt ? String(device.power_watt) : '');
      setStartupPower(device.startup_power_watt ? String(device.startup_power_watt) : '');
    }
  }, [device, isOpen]);

  if (!isOpen || !device) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('access_token');

    const payload: Record<string, any> = {
      model_name: name.trim(),
      category: category,
      power_watts: parseFloat(power),
      startup_current_watts: startupPower ? parseFloat(startupPower) : null,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${device.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(lang === 'uk' ? 'Прилад успішно оновлено' : 'Device successfully updated');
        onSuccess();
        onClose();
      } else {
        throw new Error('Помилка оновлення');
      }
    } catch (err) {
      toast.error(lang === 'uk' ? 'Не вдалося оновити прилад' : 'Failed to update device');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        
        <h2 className={styles.title}>{lang === 'uk' ? 'Редагувати прилад' : 'Edit device'}</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          
          <div className={styles.fieldWrap}>
            <label className={styles.label}>{lang === 'uk' ? 'Назва приладу' : 'Device name'}</label>
            <input 
              className={styles.input} 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className={styles.fieldWrap}>
            <label className={styles.label}>{lang === 'uk' ? 'Категорія' : 'Category'}</label>
            <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>{lang === 'uk' ? 'Потужність (Вт)' : 'Power (W)'}</label>
              <input 
                className={styles.input} 
                type="number" 
                min="1"
                value={power} 
                onChange={e => setPower(e.target.value)} 
                required 
              />
            </div>

            <div className={styles.fieldWrap}>
              <label className={styles.label}>{lang === 'uk' ? 'Пускова (Вт)' : 'Startup (W)'}</label>
              <input 
                className={styles.input} 
                type="number" 
                min="0"
                placeholder={lang === 'uk' ? 'Необов\'язково' : 'Optional'}
                value={startupPower} 
                onChange={e => setStartupPower(e.target.value)} 
              />
            </div>
          </div>

          <div className={styles.btnGroup}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {lang === 'uk' ? 'Скасувати' : 'Cancel'}
            </button>
            <button type="submit" className={styles.saveBtn} disabled={isSubmitting || !name || !power}>
              {isSubmitting ? (lang === 'uk' ? 'Збереження...' : 'Saving...') : (lang === 'uk' ? 'Зберегти' : 'Save')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
