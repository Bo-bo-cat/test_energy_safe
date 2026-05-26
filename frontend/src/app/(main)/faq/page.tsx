'use client';
import { useState } from 'react';
import styles from './page.module.css';

// ПІДКЛЮЧАЄМО СЛОВНИК
import { useTranslation } from '../../../context/LanguageContext';

export default function FaqPage() {
  const { t } = useTranslation(); 
  
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  const faqs = [
    { question: t.faq.q1, answer: t.faq.a1 },
    { question: t.faq.q2, answer: t.faq.a2 },
    { question: t.faq.q3, answer: t.faq.a3 },
    { question: t.faq.q4, answer: t.faq.a4 },
    { question: t.faq.q5, answer: t.faq.a5 },
    { question: t.faq.q6, answer: t.faq.a6 },
    { question: t.faq.q7, answer: t.faq.a7 },
    { question: t.faq.q8, answer: t.faq.a8 },
  ];

  return (
    <div className="global-page-wrap">
      <h1 className="page-title">{t.faq.title}</h1>
      <p className={styles.subtitle}>{t.faq.subtitle}</p>

      <div className={styles.list}>
        {faqs.map((faq, i) => (
          <div key={i} className={`${styles.item} ${openIndex === i ? styles.open : ''}`}>
            <button className={styles.question} onClick={() => toggle(i)}>
              <span>{faq.question}</span>
              <svg
                className={styles.chevron}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {openIndex === i && (
              <p className={styles.answer}>{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}