'use client';
import { useEffect, useState } from 'react';

export default function CalculatorPage() {
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices?user_id=${userId}`)
      .then(r => r.json())
      .then(setDevices);
  }, []);

  const totalWh = devices.reduce((sum, d) => sum + d.power_watts * d.daily_usage_hours, 0);

  return (
    <div>
      <h2>Розрахунок</h2>
      {devices.map(d => (
        <div key={d.id}>{d.model_name}: {d.power_watts * d.daily_usage_hours} Вт·год/день</div>
      ))}
      <div>Всього: {totalWh} Вт·год/день</div>
    </div>
  );
}
