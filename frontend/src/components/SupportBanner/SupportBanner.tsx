'use client';
import { useEffect, useState } from 'react';
import styles from './SupportBanner.module.css';

const MONO_URL = 'https://send.monobank.ua/jar/4NtaqVTLTB';
const STORAGE_KEY = 'support_banner_shown';

export function SupportBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, '1');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.text}>
        ❤️ Подобається Energy Safe? Підтримай розвиток проєкту!
      </span>
      <a
        href={MONO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        onClick={handleClose}
      >
        Підтримати
      </a>
      <button className={styles.close} onClick={handleClose} aria-label="Закрити">
        ✕
      </button>
    </div>
  );
}
