// src/app/(main)/layout.tsx
import Link from 'next/link';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      <aside>
        <h2>Energy Safe</h2>
        <nav>
          <Link href="/">🏠 Головна</Link>
          <Link href="/devices">🖥 Прилади</Link>
          <Link href="/calculator">⚡ Розрахунок</Link>
          <Link href="/scenarios">📋 Сценарії</Link>
          <Link href="/picker">🛒 Підбір системи</Link>
          <Link href="/profile">⚙️ Профіль</Link>
          <Link href="/auth">Auth</Link>
          <Link href="/onboarding">Dbz</Link>
        </nav>
      </aside>
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}