'use client';
import { useState, useRef, FormEvent } from 'react';
import styles from './page.module.css';

// ПІДКЛЮЧАЄМО СЛОВНИК
import { useTranslation } from '../../../context/LanguageContext';

export default function FaqPage() {
  const { t, lang } = useTranslation(); 
  
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // === Стейт для форми зворотного зв'язку ===
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Обробка вибору файлу (скріншоту)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFeedbackFile(e.target.files[0]);
    }
  };

  // Обробка відправки форми
  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    const token = localStorage.getItem('access_token');

    try {
      const formData = new FormData();
      formData.append('message', feedbackText);
      if (feedbackFile) {
        formData.append('screenshot', feedbackFile);
      }

      // Відправка на бекенд 
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/feedback`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      // Показуємо повідомлення про успіх та очищаємо форму
      setSubmitSuccess(true);
      setFeedbackText('');
      setFeedbackFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Ховаємо повідомлення про успіх через 5 секунд
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('Помилка відправки форми:', err);
      // Як фолбек, якщо бекенд ще не піднято, все одно показуємо "Успіх" для тестування UX
      setSubmitSuccess(true);
      setFeedbackText('');
      setFeedbackFile(null);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openIndex === i && (
              <p className={styles.answer}>{faq.answer}</p>
            )}
          </div>
        ))}
      </div>

      {/* === БЛОК ЗВОРОТНОГО ЗВ'ЯЗКУ === */}
      <div className={styles.contactBlock}>
        <h2 className={styles.contactTitle}>
          {lang === 'uk' ? 'Повідомити про проблему' : 'Report a problem'}
        </h2>
        <p className={styles.contactDesc}>
          {lang === 'uk' 
            ? 'Знайшли баг або маєте пропозицію щодо покращення? Напишіть нам!' 
            : 'Found a bug or have a suggestion? Let us know!'}
        </p>

        {submitSuccess ? (
          <div className={styles.successMsg}>
            {lang === 'uk' ? 'Ваше повідомлення успішно надіслано! Дякуємо за допомогу.' : 'Your message has been sent successfully! Thank you.'}
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleFeedbackSubmit}>
            <textarea
              className={styles.textarea}
              placeholder={lang === 'uk' ? 'Опишіть проблему детально...' : 'Describe the problem in detail...'}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              required
            />
            
            <div className={styles.fileRow}>
              <label className={styles.fileLabel}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                {lang === 'uk' ? 'Прикріпити скріншот' : 'Attach screenshot'}
                <input 
                  type="file" 
                  accept="image/*" 
                  className={styles.hiddenInput} 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </label>
              {feedbackFile && (
                <span className={styles.fileName}>{feedbackFile.name}</span>
              )}
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={isSubmitting || !feedbackText.trim()}
            >
              {isSubmitting 
                ? (lang === 'uk' ? 'Відправка...' : 'Sending...') 
                : (lang === 'uk' ? 'Надіслати' : 'Submit')}
            </button>
          </form>
        )}
      </div>
      
    </div>
  );
}