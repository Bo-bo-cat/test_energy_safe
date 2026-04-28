'use client';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`)
      .then(r => r.json())
      .then(setUser);
  }, []);

  return (
    <div>
      <h2>Профіль</h2>
      {user && (
        <div>
          <div>{user.name}</div>
          <div>{user.email}</div>
          <div>Інвертор: {user.has_inverter ? `${user.inverter_capacity_wh} Вт·год` : 'Немає'}</div>
        </div>
      )}
    </div>
  );
}
