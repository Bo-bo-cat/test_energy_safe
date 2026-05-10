'use client';
import { useState, useEffect } from 'react';
import styles from './InstallPrompt.module.css';
import { MobileIcon } from '../components/icons/Mobile'; 
import { useTranslation } from '../context/LanguageContext';

export function InstallPrompt() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [os, setOs] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (hasDismissed) return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
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
      {showBanner && (
        <div className={styles.bannerOverlay}>
          <div className={styles.bannerContent}>
            <div className={styles.iconWrap}><MobileIcon className={styles.mobileIcon} /></div>
            <div className={styles.bannerText}>{t.installApp.bannerText}</div>
          </div>
          <div className={styles.bannerActions}>
            <button className={styles.installBtn} onClick={handleOpenModal}>{t.installApp.installBtn}</button>
            <button className={styles.closeBannerBtn} onClick={handleDismissBanner}>✕</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{t.installApp.modalTitle}</h2>
            <div className={styles.steps}>
              {os === 'ios' ? (
                ['iosStep1', 'iosStep2', 'iosStep3'].map((step, i) => (
                  <div key={i} className={styles.step}>
                    <div className={styles.stepNumber}>{i+1}</div>
                    <div className={styles.stepText}>{(t.installApp as any)[step]}</div>
                  </div>
                ))
              ) : (
                ['androidStep1', 'androidStep2', 'androidStep3'].map((step, i) => (
                  <div key={i} className={styles.step}>
                    <div className={styles.stepNumber}>{i+1}</div>
                    <div className={styles.stepText}>{(t.installApp as any)[step]}</div>
                  </div>
                ))
              )}
            </div>
            <button className={styles.closeModalBtn} onClick={handleCloseModal}>{t.installApp.closeBtn}</button>
          </div>
        </div>
      )}
    </>
  );
}