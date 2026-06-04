'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

import { LightningIcon } from '../components/icons/Lightning';
import { CalcIcon } from '../components/icons/Calc';
import { SystemIcon } from '../components/icons/System';
import { ScenarioIcon } from '../components/icons/Scenario';
import { LanguageProvider, useTranslation } from '../context/LanguageContext';

function LandingPageContent() {
  const { t } = useTranslation();
  
  // Стейт для модалки та відкритого питання
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (i: number) => setOpenIndex(openIndex === i ? null : i);

  // Беремо питання зі словника, як на повноцінній сторінці FAQ
  const faqs = [
    { question: t.faq?.q1, answer: t.faq?.a1 },
    { question: t.faq?.q2, answer: t.faq?.a2 },
    { question: t.faq?.q3, answer: t.faq?.a3 },
    { question: t.faq?.q4, answer: t.faq?.a4 },
    { question: t.faq?.q5, answer: t.faq?.a5 },
  ];

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
            {/* ЗМІНЕНО З <Link> НА <button> */}
            <button onClick={() => setIsFaqOpen(true)} className={styles.faqBtn}>
              Часті запитання (FAQ)
            </button>
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

      {/* МОДАЛЬНЕ ВІКНО FAQ */}
      {isFaqOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsFaqOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsFaqOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>{t.faq?.title || 'Часті запитання'}</h2>

            <div className={styles.faqList}>
              {faqs.map((faq, i) => faq.question && (
                <div key={i} className={`${styles.faqItem} ${openIndex === i ? styles.open : ''}`}>
                  <button className={styles.faqQuestion} onClick={() => toggleFaq(i)}>
                    <span>{faq.question}</span>
                    <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {openIndex === i && <p className={styles.faqAnswer}>{faq.answer}</p>}
                </div>
              ))}
            </div>
            
            <div className={styles.modalFooter}>
               <p>{t.faq?.subtitle || 'Не знайшли відповідь?'}</p>
               <Link href="/auth?mode=register" className={styles.footerLink}>
                 Зареєструйтесь, щоб звернутися до підтримки
               </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function LandingPage() {
  return (
    <LanguageProvider>
      <LandingPageContent />
    </LanguageProvider>
  );
}