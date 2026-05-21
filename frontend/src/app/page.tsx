'use client';
import Link from 'next/link';
import styles from './page.module.css';


import { LightningIcon } from '../components/icons/Lightning';
import { CalcIcon } from '../components/icons/Calc';
import { SystemIcon } from '../components/icons/System';
import { ScenarioIcon } from '../components/icons/Scenario';

export default function LandingPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        
        {/* 1. Логотип */}
        <div className={styles.logoWrap}>
          <LightningIcon className={styles.logoIcon} />
          <span className={styles.logoText}>Energy Safe</span>
        </div>

        {/* 2. Заголовок */}
        <h1 className={styles.mainTitle}>
          Плануйте енергозабезпечення<br />
          <span className={styles.highlight}>без складних розрахунків</span>
        </h1>

        {/* 3. Що можна робити (Картки) */}
        <div className={styles.rightContent}>
          <h2 className={styles.featuresTitle}>Що можна зробити?</h2>
          <div className={styles.featureCards}>
            <div className={styles.card}>
              <div className={styles.cardIconWrap}>
                <CalcIcon className={styles.cardIcon} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Розрахувати навантаження</h3>
                <p className={styles.cardDesc}>Обери прилади та отримай енергоспоживання</p>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIconWrap}>
                <SystemIcon className={styles.cardIcon} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Підібрати систему</h3>
                <p className={styles.cardDesc}>Отримай рекомендацію ДБЖ під свої потреби</p>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIconWrap}>
                <ScenarioIcon className={styles.cardIcon} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Зберігати сценарії</h3>
                <p className={styles.cardDesc}>Створюй різні варіанти для дому або офісу</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Короткий опис */}
        <p className={styles.desc}>
          Наш застосунок допомагає швидко оцінити енергоспоживання,
          підібрати систему резервного живлення та зберігати сценарії.
        </p>

        {/* 5. Кнопка "Почати" */}
        <Link href="/auth?mode=register" className={styles.startBtn}>
          Почати
        </Link>

      </div>
    </div>
  );
}
