'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        has_inverter: false,
        inverter_capacity_wh: null,
      }),
    });

    let user;

    if (res.status === 409) {
      // Користувач вже існує — логінимо через GET /users?email=
      const loginRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users?email=${encodeURIComponent(email)}`
      );
      if (!loginRes.ok) return;
      user = await loginRes.json();
    } else if (res.ok) {
      user = await res.json();
    } else {
      return;
    }

    if (!user.id) return;
    localStorage.setItem('user_id', user.id);
    localStorage.setItem('user_name', user.name);
    router.push('/');
  }

  return (
    <div>
      <h1>Вхід</h1>
      <form onSubmit={handleSubmit}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ім'я" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <button type="submit">Увійти</button>
      </form>
    </div>
  );
}
