'use client';
import { useState } from 'react';
import styles from './page.module.css';

const faqs = [
  {
    question: 'Що таке ДБЖ і навіщо він потрібен?',
    answer: 'ДБЖ (Джерело Безперебійного Живлення) — це пристрій, який забезпечує резервне живлення техніки під час відключення електроенергії. Він заряджає батарею від мережі та автоматично перемикається на неї при знеструмленні.',
  },
  {
    question: 'Як додати прилад?',
    answer: 'Перейдіть у розділ "Прилади" через бічне меню. Натисніть кнопку "Додати прилад", оберіть тип вручну або відскануйте пристрій, вкажіть потужність та натисніть "Зберегти".',
  },
  {
    question: 'Як розрахувати автономію?',
    answer: 'Перейдіть у розділ "Розрахунок". Оберіть сценарій з приладами та ДБЖ, натисніть "Розрахувати". Система покаже загальну потужність, відсоток навантаження та орієнтовний час автономної роботи.',
  },
  {
    question: 'Що таке сценарій?',
    answer: 'Сценарій — це збережений набір приладів для конкретної ситуації (наприклад, "Нічна робота" або "Мінімальний режим"). Ви можете мати кілька сценаріїв і швидко перемикатися між ними.',
  },
  {
    question: 'Як створити сценарій?',
    answer: 'Перейдіть у розділ "Сценарії", натисніть "Новий сценарій". Дайте йому назву, оберіть прилади зі списку та систему живлення, після чого збережіть.',
  },
  {
    question: 'Як змінити пароль?',
    answer: 'Перейдіть у "Профіль" → натисніть "Змінити пароль". Введіть поточний пароль, потім новий (мінімум 4 символи) та підтвердіть збереження.',
  },
  {
    question: 'Що робити, якщо забув пароль?',
    answer: 'Наразі відновлення пароля через email не реалізовано. Зверніться до служби підтримки або зареєструйтеся з новим акаунтом.',
  },
  {
    question: 'Як видалити акаунт?',
    answer: 'Перейдіть у "Профіль" → натисніть "Видалити акаунт" та підтвердіть дію. Увага: це незворотна операція — всі ваші дані, прилади та сценарії будуть видалені.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>FAQ</h1>
      <p className={styles.subtitle}>Відповіді на найпоширеніші запитання</p>

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
    </div>
  );
}
