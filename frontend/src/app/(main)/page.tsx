// src/app/page.tsx  →  localhost:5000/

export default function HomePage() {
  return (
    <div>
      {/* ЗАГОЛОВОК */}
      <h1>Привіт, User</h1>

      {/* СТАТУС СИСТЕМИ */}
      <section>
        <h2>Статус системи</h2>
        <div>48% — 480 Вт з 1000 Вт</div>
        <div>480 Вт — Робоча</div>
        <div>1200 Вт — Пуск</div>
        <div>3.5 год — Автономія</div>
      </section>

      {/* ШВИДКІ ДІЇ */}
      <section>
        <button>📷 Додати прилад</button>
        <button>⚡ Розрахувати</button>
        <button>📋 Сценарії</button>
        <button>🛒 Підібрати систему</button>
      </section>

      {/* МОЇ ПРИЛАДИ */}
      <section>
        <h3>Мої прилади</h3>
        <div>Холодильник 150 Вт</div>
        <div>Ноутбук 65 Вт</div>
        <div>Роутер 12 Вт</div>
        <div>Лампи 30 Вт</div>
        <button>+ Додати</button>
      </section>

      {/* АКТИВНИЙ СЦЕНАРІЙ */}
      <section>
        <h3>Активний сценарій</h3>
        <h2>Нічний режим</h2>
        <p>Холодильник + Роутер + Лампи</p>
        <div>5 приладів зареєстровано</div>
        <div>3 сценарії активних</div>
        <div>23% приладів зараз</div>
      </section>
    </div>
  );
}
