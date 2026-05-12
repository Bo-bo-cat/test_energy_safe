'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const userId = params.get('user_id');
    const userName = params.get('user_name');

    if (token && userId) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_id', userId);
      localStorage.setItem('user_name', userName ?? '');
      document.cookie = `access_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      router.replace('/');
    } else {
      router.replace('/auth?error=callback');
    }
  }, [params, router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      color: 'var(--text-main)',
      background: 'var(--bg-main)',
    }}>
      Входимо через Google...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
