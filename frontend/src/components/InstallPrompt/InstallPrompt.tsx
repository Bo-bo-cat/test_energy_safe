'use client';
import { useState, useEffect } from 'react';
import styles from './InstallPrompt.module.css';

import { MobileIcon } from '../icons/Mobile'; 
import { DeviceIcon } from '../icons/Device'; // Підключаємо іконку ПК
import { useTranslation } from '../../context/LanguageContext';

export function InstallPrompt() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [os, setOs] = useState<'ios' | 'android' | 'pc' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Перехоплюємо системну подію встановлення (працює на ПК Chrome/Edge та Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 1. Перевіряємо, чи користувач вже закривав банер
    const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (hasDismissed) return;

    // 2. Перевіряємо, чи додаток ВЖЕ встановлено (режим standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone);
    if (isStandalone) return;

    // 3. Визначаємо операційну систему
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setOs('ios');
    } else if (isAndroid) {
      setOs('android');
    } else {
      setOs('pc'); // Все інше вважаємо десктопом
    }
    
    setShowBanner(true);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleDismissBanner = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowBanner(false);
  };

  const handleOpenModal = async () => {
    setShowBanner(false);
    
    // Якщо браузер підтримує швидке встановлення - показуємо системне вікно (без нашої модалки)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('pwa_prompt_dismissed', 'true');
      }
      setDeferredPrompt(null);
    } else {
      // Якщо це iOS Safari (який не підтримує beforeinstallprompt) або сталася помилка - показуємо інструкцію
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* ПЛАВАЮЧИЙ БАНЕР */}
      {showBanner && (
        <div className={styles.bannerOverlay}>
          <div className={styles.bannerContent}>
            <div className={styles.iconWrap}>
              {os === 'pc' ? (
                <DeviceIcon className={styles.pcIcon} />
              ) : (
                <MobileIcon className={styles.mobileIcon} />
              )}
            </div>
            <div className={styles.bannerText}>
              {t.installApp.bannerText}
            </div>
          </div>
          <div className={styles.bannerActions}>
            <button className={styles.installBtn} onClick={handleOpenModal}>
              {t.installApp.installBtn}
            </button>
            <button className={styles.closeBannerBtn} onClick={handleDismissBanner}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* МОДАЛКА З ІНСТРУКЦІЄЮ (показується тільки якщо системне вікно недоступне) */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{t.installApp.modalTitle}</h2>
            
            <div className={styles.steps}>
              {os === 'ios' ? (
                <>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepText}>{t.installApp.iosStep1}</div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepText}>{t.installApp.iosStep2}</div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepText}>{t.installApp.iosStep3}</div>
                  </div>
                </>
              ) : os === 'pc' ? (
                <>
                  {/* Інструкція для ПК, якщо нативне вікно не спрацювало */}
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepText}>{t.installApp.pcStep1 || 'Відкрийте сайт у браузері Chrome або Edge.'}</div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepText}>{t.installApp.pcStep2 || 'Натисніть на іконку встановлення (монітор зі стрілочкою) у правій частині адресного рядка.'}</div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepText}>{t.installApp.pcStep3 || 'Підтвердіть встановлення, натиснувши "Встановити".'}</div>
                  </div>
                </>
              ) : (
                <>
                  {/* Інструкція для Android */}
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepText}>{t.installApp.androidStep1}</div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepText}>{t.installApp.androidStep2}</div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepText}>{t.installApp.androidStep3}</div>
                  </div>
                </>
              )}
            </div>

            <button className={styles.closeModalBtn} onClick={handleCloseModal}>
              {t.installApp.closeBtn}
            </button>
          </div>
        </div>
      )}
    </>
  );
}