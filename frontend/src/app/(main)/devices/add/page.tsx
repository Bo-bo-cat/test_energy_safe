'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { CameraIcon } from '../../../../components/icons/Camera';
import { PenIcon } from '../../../../components/icons/Pen';
import { AlertModal } from '../../../../components/AlertModal/AlertModal';

// ПІДКЛЮЧАЄМО СЛОВНИК
import { useTranslation } from '../../../../context/LanguageContext';

export default function AddDevicePage() {
  const { t } = useTranslation(); 
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  // Стан для відслідковування наведення на картку камери
  const [isHovered, setIsHovered] = useState(false);

  const handleCameraClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    setIsAlertOpen(true); 
  };

  return (
    <main className={styles['page']}>
      <h1 className={styles['title']}>{t.deviceAdd.title}</h1>

      <section className={styles['cards']}>
        <Link 
          href="#" 
          onClick={handleCameraClick} 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={styles['card']}
        >
          <div className={styles['card-inner']}>
            <span className={styles['icon']}>
              <CameraIcon className={styles['icon-camera']} />
            </span>
            {/* Текст змінюється при наведенні */}
            <h2 className={styles['card-title']}>
              {isHovered ? t.deviceAdd.soon : t.deviceAdd.photoLabel}
            </h2>
          </div>
        </Link>

        <Link href="/devices/add/manual" className={styles['card']}>
          <div className={styles['card-inner']}>
            <span className={styles['icon']}>
              <PenIcon className={styles['icon-pencil']} />
            </span>
            <h2 className={styles['card-title']}>{t.deviceAdd.manualLabel}</h2>
          </div>
        </Link>
      </section>

      <section className={styles['hint']}>
        <h3 className={styles['hint-title']}>{t.deviceAdd.hintTitle}</h3>
        <p className={styles['hint-text']}>
          {t.deviceAdd.hintText}
        </p>
      </section>

      <AlertModal 
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={t.deviceAdd.soon}
      />
    </main>
  );
}