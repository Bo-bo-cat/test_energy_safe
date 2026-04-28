'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`)
      .then(r => r.json())
      .then(setUser);
  }, []);

  function clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    document.cookie = 'access_token=; path=/; max-age=0';
  }

  function handleLogout() {
    clearSession();
    router.push('/auth');
  }

  async function handleDeleteAccount() {
    if (!confirm('Видалити акаунт? Всі ваші дані будуть видалені безповоротно.')) return;
    const token = localStorage.getItem('access_token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    clearSession();
    router.push('/auth');
  }

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
      <button onClick={handleLogout}>Вийти з акаунту</button>
      <button onClick={handleDeleteAccount}>Видалити акаунт</button>
    </div>
  );
}
