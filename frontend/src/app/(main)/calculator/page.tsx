'use client';
import { useEffect, useState } from 'react';

export default function CalculatorPage() {
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDevices(data); });
  }, []);

  const totalWh = devices.reduce((sum, d) => sum + d.power_watts * (d.daily_usage_hours ?? 1), 0);

  return (
    <div>
      <h2>Розрахунок</h2>
      {devices.map(d => (
        <div key={d.id ?? d._id}>
          {d.model_name}: {d.power_watts * (d.daily_usage_hours ?? 1)} Вт·год/день
        </div>
      ))}
      <div>Всього: {totalWh} Вт·год/день</div>
    </div>
  );
}
