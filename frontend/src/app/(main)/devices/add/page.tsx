'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { CameraIcon } from '../../../../components/icons/Camera';
import { PenIcon } from '../../../../components/icons/Pen';
import { AlertModal } from '../../../../components/AlertModal';

export default function AddDevicePage() {
  // Стейт для нашої нової модалки
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Функція для обробки кліку по кнопці "Фото етикетки"
  const handleCameraClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Зупиняємо перехід за посиланням
    setIsAlertOpen(true); // Відкриваємо нашу кастомну модалку
  };

  return (
    <main className={styles['page']}>
      <h1 className={styles['title']}>Додати прилад</h1>

      <section className={styles['cards']}>
        {/* Кнопка 1: Фото етикетки */}
        <Link 
          href="#" 
          onClick={handleCameraClick} 
          className={styles['card']}
        >
          <div className={styles['card-inner']}>
            <span className={styles['icon']}>
              <CameraIcon className={styles['icon-camera']} />
            </span>
            <h2 className={styles['card-title']}>Фото етикетки</h2>
          </div>
        </Link>

        {/* Кнопка 2: Ввести вручну -> перехід на форму */}
        <Link href="/devices/add/manual" className={styles['card']}>
          <div className={styles['card-inner']}>
            <span className={styles['icon']}>
              <PenIcon className={styles['icon-pencil']} />
            </span>
            <h2 className={styles['card-title']}>Ввести вручну</h2>
          </div>
        </Link>
      </section>

      <section className={styles['hint']}>
        <h3 className={styles['hint-title']}>Підказка</h3>
        <p className={styles['hint-text']}>
          Шукай чорно-жовту наклейку з написом “Вт” або “W” - зазвичай на задній панелі або знизу приладу
        </p>
      </section>

      {/* Наша кастомна модалка */}
      <AlertModal 
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Скоро буде!"
        message="Функція розпізнавання етикеток по фото знаходиться в розробці. Поки що скористайтесь ручним введенням."
        buttonText="Зрозуміло"
      />
    </main>
  );
}