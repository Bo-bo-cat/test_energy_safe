'use client';
import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        
        {/* ЛІВА ЧАСТИНА: Текст та заклик до дії */}
        <div className={styles.leftContent}>
          <div className={styles.logo}>
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
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
                <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                  <rect x="9" y="9" width="6" height="6"></rect>
                  <line x1="9" y1="1" x2="9" y2="4"></line>
                  <line x1="15" y1="1" x2="15" y2="4"></line>
                  <line x1="9" y1="20" x2="9" y2="23"></line>
                  <line x1="15" y1="20" x2="15" y2="23"></line>
                  <line x1="20" y1="9" x2="23" y2="9"></line>
                  <line x1="20" y1="14" x2="23" y2="14"></line>
                  <line x1="1" y1="9" x2="4" y2="9"></line>
                  <line x1="1" y1="14" x2="4" y2="14"></line>
                </svg>
              </div>
              <div>
                <h3 className={styles.cardTitle}>Розрахувати навантаження</h3>
                <p className={styles.cardDesc}>Обери прилади та отримай енергоспоживання</p>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIconWrap}>
                <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="11" rx="2" ry="2"></rect>
                  <line x1="22" y1="11" x2="22" y2="14"></line>
                  <line x1="6" y1="11" x2="6" y2="14"></line>
                  <line x1="10" y1="11" x2="10" y2="14"></line>
                  <line x1="14" y1="11" x2="14" y2="14"></line>
                </svg>
              </div>
              <div>
                <h3 className={styles.cardTitle}>Підібрати систему</h3>
                <p className={styles.cardDesc}>Отримай рекомендацію ДБЖ під свої потреби</p>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIconWrap}>
                <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
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