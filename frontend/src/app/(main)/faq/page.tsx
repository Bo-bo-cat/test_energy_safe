'use client';
import { useState } from 'react';
import styles from './page.module.css';

import { useTranslation } from '../../../context/LanguageContext';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function FaqPage() {
  const { t } = useTranslation();


  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({});

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

  const validate = () => {
    const e: { email?: string; message?: string } = {};
    if (!email.trim()) e.email = t.faq.contactEmailRequired;
    if (!message.trim()) e.message = t.faq.contactMessageRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('loading');
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('message', message);
      if (name) formData.append('name', name);
      if (file) formData.append('file', file);

      const res = await fetch(`${API}/feedback/`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error();

      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      setFile(null);
      setErrors({});
    } catch {
      setStatus('error');
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

      <div className={styles.contactBlock}>
        <h2 className={styles.contactTitle}>{t.faq.contactTitle}</h2>
        <p className={styles.contactSubtitle}>{t.faq.contactSubtitle}</p>

        {status === 'success' ? (
          <p className={styles.successMsg}>{t.faq.contactSuccess}</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <input
              className={styles.input}
              type="text"
              placeholder={t.faq.contactName}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className={styles.fieldWrap}>
              <input
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                type="email"
                placeholder={t.faq.contactEmail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={styles.fieldWrap}>
              <textarea
                className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                placeholder={t.faq.contactMessage}
                rows={4}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
                }}
              />
              {errors.message && <span className={styles.errorText}>{errors.message}</span>}
            </div>

            <div className={styles.fieldWrap}>
              <label className={styles.fileLabel}>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <span className={styles.fileBtn}>
                  {file ? file.name : t.faq.contactAttach}
                </span>
              </label>
            </div>

            {status === 'error' && <p className={styles.errorMsg}>{t.faq.contactError}</p>}

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? t.faq.contactSending : t.faq.contactSend}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
