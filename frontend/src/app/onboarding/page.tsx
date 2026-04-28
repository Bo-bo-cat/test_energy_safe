'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { LightningIcon } from '../../components/icons/Lightning';
import { SystemIcon } from '../../components/icons/System'; // ⚠️ Перевірте шлях до вашої SystemIcon

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className={styles['page-container']}>
      
      {/* Логотип зверху зліва */}
      <div className={styles['logo-container']}>
        <LightningIcon className={styles['logo-icon']} />
        <div className={styles['logo-text']}>Energy Safe</div>
      </div>

      {/* Центральна картка */}
      <div className={styles['onboard-card']}>
        
        {/* Велика помаранчева іконка */}
        <div className={styles['icon-wrapper']}>
          <SystemIcon className={styles['system-icon']} />
        </div>
        
        <h1 className={styles['question-text']}>Чи є у вас ДБЖ чи інвертор?</h1>
        
        {/* Група кнопок */}
        <div className={styles['button-group']}>
          <button 
            className={styles['action-button']} 
            onClick={() => router.push('/picker?hasUps=true')}
          >
            Так
          </button>
          <button 
            className={styles['action-button']} 
            onClick={() => router.push('/picker?hasUps=false')}
          >
            Ні
          </button>
        </div>

      </div>
    </div>
  );
}