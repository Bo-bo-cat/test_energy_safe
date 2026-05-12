'use client';
import { useState, useEffect } from 'react';
import styles from './InstallPrompt.module.css';
import { MobileIcon } from '../icons/Mobile'; // Переконайся, що шлях до твоєї іконки вірний
import { useTranslation } from '../../context/LanguageContext';

export function InstallPrompt() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [os, setOs] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    // 1. Перевіряємо, чи користувач вже закривав банер
    const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (hasDismissed) return;

    // 2. Перевіряємо, чи додаток ВЖЕ встановлено (працює як standalone PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone);
    if (isStandalone) return;

    // 3. Визначаємо операційну систему
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    // Показуємо банер тільки на мобільних пристроях
    if (isIOS) {
      setOs('ios');
      setShowBanner(true);
    } else if (isAndroid) {
      setOs('android');
      setShowBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowBanner(false);
  };

  const handleOpenModal = () => {
    setShowBanner(false);
    setShowModal(true);
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
              <MobileIcon className={styles.mobileIcon} />
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

      {/* МОДАЛКА З ІНСТРУКЦІЄЮ */}
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
              ) : (
                <>
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