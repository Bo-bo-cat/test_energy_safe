import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

import { LightningIcon } from '../components/icons/Lightning';
import { CalcIcon } from '../components/icons/Calc';
import { SystemIcon } from '../components/icons/System';
import { ScenarioIcon } from '../components/icons/Scenario';

export const metadata: Metadata = {
  title: 'Energy Safe — Плануйте енергозабезпечення без складних розрахунків',
  description: 'Розрахуйте навантаження побутових приладів, підберіть ДБЖ або інвертор та збережіть сценарії для дому або офісу. Безкоштовно та без реєстрації.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Energy Safe — Плануйте енергозабезпечення без складних розрахунків',
    description: 'Розрахуйте навантаження побутових приладів, підберіть ДБЖ або інвертор та збережіть сценарії для дому або офісу.',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Energy Safe — Плануйте енергозабезпечення без складних розрахунків',
    description: 'Розрахуйте навантаження побутових приладів, підберіть ДБЖ або інвертор та збережіть сценарії для дому або офісу.',
  },
};

export default function LandingPage() {
  return (
    <main className={styles.wrap}>
      
      {/* ЛОГОТИП */}
      <header className={styles.logoWrap}>
        <LightningIcon className={styles.logoIcon} aria-hidden="true" />
        <span className={styles.logoText}>Energy Safe</span>
      </header>

      <div className={styles.container}>
        
        {/* ЛІВА ЧАСТИНА (Текст + Кнопки) */}
        <div className={styles.leftContent}>
          <h1 className={styles.mainTitle}>
            Плануйте енергозабезпечення
            <span className={styles.highlight}>без складних розрахунків</span>
          </h1>

          <p className={styles.desc}>
            Energy Safe допомагає швидко оцінити енергоспоживання приладів, 
            підібрати надійну систему резервного живлення (ДБЖ, зарядні станції) 
            та зберігати власні сценарії для дому чи офісу.
          </p>

          <div className={styles.btnGroup}>
            <Link href="/auth?mode=register" className={styles.startBtn}>
              Почати розрахунок
            </Link>
            <Link href="/faq" className={styles.faqBtn}>
              Часті запитання (FAQ)
            </Link>
          </div>
        </div>

        {/* ПРАВА ЧАСТИНА (Картки) */}
        <section className={styles.rightContent} aria-labelledby="features-title">
          <h2 id="features-title" className={styles.featuresTitle}>Що можна зробити?</h2>
          
          <div className={styles.featureCards}>
            <article className={styles.card}>
              <div className={styles.cardIconWrap} aria-hidden="true">
                <CalcIcon className={styles.cardIcon} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Розрахувати навантаження</h3>
                <p className={styles.cardDesc}>Оберіть ваші прилади та миттєво отримайте їхнє сумарне енергоспоживання.</p>
              </div>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIconWrap} aria-hidden="true">
                <SystemIcon className={styles.cardIcon} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Підібрати систему живлення</h3>
                <p className={styles.cardDesc}>Отримайте точну рекомендацію резервного ДБЖ або станції под ваші потреби.</p>
              </div>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIconWrap} aria-hidden="true">
                <ScenarioIcon className={styles.cardIcon} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Зберігати сценарії</h3>
                <p className={styles.cardDesc}>Створюйте, зберігайте та порівнюйте різні варіанти для дому або офісу.</p>
              </div>
            </article>
          </div>
        </section>

      </div>
    </main>
  );
}