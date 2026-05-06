'use client';
import Link from 'next/link';
import styles from './page.module.css';

// ІМПОРТУЄМО ВАШІ НОВІ ІКОНКИ
// Переконайтеся, що шляхи правильні (наприклад, src/components/icons/)
import { LightningIcon } from '../components/icons/Lightning';
import { CalcIcon } from '../components/icons/Calc';
import { SystemIcon } from '../components/icons/System';
import { ScenarioIcon } from '../components/icons/Scenario';

export default function LandingPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        
        {/* ЛІВА ЧАСТИНА: Текст та заклик до дії */}
        <div className={styles.leftContent}>
          <div className={styles.logo}>
            {/* Використовуємо LightningIcon як логотип */}
            <LightningIcon className={styles.logoIcon} />
            Energy Safe
          </div>

          <h1 className={styles.mainTitle}>
            Плануйте енергозабезпечення<br />
            <span className={styles.highlight}>без складних розрахунків</span>
          </h1>

          <p className={styles.desc}>
            Наш застосунок допомагає швидко оцінити енергоспоживання,
            підібрати систему резервного живлення та зберігати сценарії.
          </p>

          <p className={styles.subDesc}>
            Для користувача — простий інструмент.<br />
            Для бізнесу — швидке прийняття рішень без ручних розрахунків.
          </p>

          <Link href="/auth?mode=register" className={styles.startBtn}>
            Почати
          </Link>
        </div>

        {/* ПРАВА ЧАСТИНА: Картки можливостей */}
        <div className={styles.rightContent}>
          <h2 className={styles.featuresTitle}>Що можна зробити?</h2>

          <div className={styles.featureCards}>
            <div className={styles.card}>
              <div className={styles.cardIconWrap}>
                {/* Використовуємо CalcIcon */}
                <CalcIcon className={styles.cardIcon} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Розрахувати навантаження</h3>
                <p className={styles.cardDesc}>Обери прилади та отримай енергоспоживання</p>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIconWrap}>
                {/* Використовуємо SystemIcon */}
                <SystemIcon className={styles.cardIcon} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Підібрати систему</h3>
                <p className={styles.cardDesc}>Отримай рекомендацію ДБЖ під свої потреби</p>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIconWrap}>
                {/* Використовуємо ScenarioIcon */}
                <ScenarioIcon className={styles.cardIcon} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Зберігати сценарії</h3>
                <p className={styles.cardDesc}>Створюй різні варіанти для дому або офісу</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}