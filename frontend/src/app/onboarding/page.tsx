// app/onboarding/page.tsx
'use client';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div>
      <h1>Чи є у вас ДБЖ?</h1>
      <button onClick={() => router.push('/picker?hasUps=true')}>Так</button>
      <button onClick={() => router.push('/picker?hasUps=false')}>Ні</button>
    </div>
  );
}