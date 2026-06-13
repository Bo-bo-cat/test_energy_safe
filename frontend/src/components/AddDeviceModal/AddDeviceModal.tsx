'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AddDeviceModal.module.css';

import { CameraIcon } from '../icons/Camera';
import { SearchIcon } from '../icons/Search';
import { useTranslation } from '../../context/LanguageContext';

const API = process.env.NEXT_PUBLIC_API_URL;

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDeviceModal = ({ isOpen, onClose }: AddDeviceModalProps) => {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCameraClick = () => {
    setScanError('');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError('');

    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/devices/scan-label`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setScanError(data.detail || (lang === 'uk' ? 'Не вдалося розпізнати етикетку' : 'Could not read label'));
        return;
      }

      const data = await res.json();
      const params = new URLSearchParams({
        name: data.name || '',
        power: String(data.power_watts || ''),
        category: data.category || '',
        ...(data.startup_current_watts ? { startup: String(data.startup_current_watts) } : {}),
      });

      onClose();
      router.push(`/devices/manual?${params.toString()}`);
    } catch {
      setScanError(lang === 'uk' ? 'Помилка з\'єднання з сервером' : 'Server connection error');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSearchClick = () => {
    onClose();
    router.push('/devices/manual');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>

        <h1 className={styles.title}>{t.deviceAdd?.title || 'Додати прилад'}</h1>

        <section className={styles.cards}>
          <button onClick={handleCameraClick} className={styles.card} disabled={isScanning}>
            <div className={styles.cardInner}>
              <span className={styles.icon}>
                {isScanning
                  ? <span style={{ fontSize: 32 }}>⏳</span>
                  : <CameraIcon className={styles.iconCamera} />}
              </span>
              <h2 className={styles.cardTitle}>
                {isScanning
                  ? (lang === 'uk' ? 'Розпізнаю...' : 'Scanning...')
                  : (t.deviceAdd?.photoLabel || 'Сфотографувати етикетку')}
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

        {scanError && (
          <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 600, textAlign: 'center', marginTop: 8 }}>
            {scanError}
          </p>
        )}

        <section className={styles.hint}>
          <h3 className={styles.hintTitle}>{t.deviceAdd?.hintTitle || 'Підказка'}</h3>
          <p className={styles.hintText}>{t.deviceAdd?.hintText}</p>
        </section>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};