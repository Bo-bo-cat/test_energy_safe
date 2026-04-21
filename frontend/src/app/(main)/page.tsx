'use client';
// src/app/page.tsx  →  localhost:5000/
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [userName, setUserName] = useState('User');
  const [devices, setDevices] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const name = localStorage.getItem('user_name');
    if (name) setUserName(name);
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, { headers })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDevices(data); });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios`, { headers })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setScenarios(data); });
  }, []);

  const totalWatts = devices.reduce((sum, d) => sum + d.power_watts, 0);
  const activeScenario = scenarios[0];

  return (
    <div>
      {/* ЗАГОЛОВОК */}
      <h1>Привіт, {userName}</h1>

      {/* СТАТУС СИСТЕМИ */}
      <section>
        <h2>Статус системи</h2>
        <div>{totalWatts} Вт — загальне навантаження</div>
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
        {devices.map(d => (
          <div key={d.id}>{d.model_name} {d.power_watts} Вт</div>
        ))}
        <button>+ Додати</button>
      </section>

      {/* АКТИВНИЙ СЦЕНАРІЙ */}
      <section>
        <h3>Активний сценарій</h3>
        <h2>{activeScenario?.name ?? 'Немає'}</h2>
        <p>{activeScenario ? `${activeScenario.total_consumption_wh} Вт·год` : '—'}</p>
        <div>{devices.length} приладів зареєстровано</div>
        <div>{scenarios.length} сценарії активних</div>
        <div>{Math.round((devices.length / (devices.length || 1)) * 100)}% приладів зараз</div>
      </section>
    </div>
  );
}
