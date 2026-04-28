'use client';
import { useEffect, useState } from 'react';

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios?user_id=${userId}`)
      .then(r => r.json())
      .then(setScenarios);
  }, []);

  return (
    <div>
      <h2>Сценарії</h2>
      {scenarios.map(s => (
        <div key={s.id}>{s.name} — {s.total_consumption_wh} Вт·год</div>
      ))}
    </div>
  );
}
