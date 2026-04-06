'use client';
import { useEffect, useState } from 'react';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices?user_id=${userId}`)
      .then(r => r.json())
      .then(setDevices);
  }, []);

  return (
    <div>
      <h2>Прилади</h2>
      {devices.map(d => (
        <div key={d.id}>{d.model_name} — {d.power_watts} Вт</div>
      ))}
    </div>
  );
}
