'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AddDeviceModal.module.css';

import { CameraIcon } from '../icons/Camera';
import { SearchIcon } from '../icons/Search'; // Підключаємо іконку лупи
import { AlertModal } from '../AlertModal/AlertModal';
import { useTranslation } from '../../context/LanguageContext';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDeviceModal = ({ isOpen, onClose }: AddDeviceModalProps) => {
  const { t, lang } = useTranslation();
  const router = useRouter();
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Блокуємо скрол фону, коли модалка відкрита
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCameraClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAlertOpen(true);
  };

  const handleSearchClick = () => {
    onClose(); 
    // ВИПРАВЛЕНИЙ ШЛЯХ
    router.push('/devices/manual'); 
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        
        <h1 className={styles.title}>{t.deviceAdd?.title || 'Додати прилад'}</h1>

        <section className={styles.cards}>
          <button 
            onClick={handleCameraClick} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={styles.card}
          >
            <div className={styles.cardInner}>
              <span className={styles.icon}>
                <CameraIcon className={styles.iconCamera} />
              </span>
              <h2 className={styles.cardTitle}>
                {isHovered ? (t.deviceAdd?.soon || 'Незабаром') : (t.deviceAdd?.photoLabel || 'Сфотографувати етикетку')}
              </h2>
            </div>
          </button>

          <button onClick={handleSearchClick} className={styles.card}>
            <div className={styles.cardInner}>
              <span className={styles.icon}>
                <SearchIcon className={styles.iconSearch} />
              </span>
              <h2 className={styles.cardTitle}>
                {lang === 'uk' ? 'Знайти прилад' : 'Find device'}
              </h2>
            </div>
          </button>
        </section>

        <section className={styles.hint}>
          <h3 className={styles.hintTitle}>{t.deviceAdd?.hintTitle || 'Як це працює?'}</h3>
          <p className={styles.hintText}>
            {t.deviceAdd?.hintText || 'Сфотографуйте заводську етикетку приладу, або знайдіть його вручну за допомогою пошуку за моделлю.'}
          </p>
        </section>

      </div>
      
      <AlertModal 
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={t.deviceAdd?.soon || 'Незабаром'}
      />
    </div>
  );
};