import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // 1. Отримуємо токен з кукі
  const token = request.cookies.get('access_token')?.value;

  // 2. Отримуємо поточний шлях (URL), куди намагається перейти користувач
  const { pathname } = request.nextUrl;

  // 3. Якщо токена НЕМАЄ, і користувач намагається зайти кудись ОКРІМ сторінки /auth
  if (!token && !pathname.startsWith('/auth')) {
    // Перенаправляємо його на сторінку авторизації
    const authUrl = new URL('/auth', request.url);
    return NextResponse.redirect(authUrl);
  }

  // 4. Якщо токен Є, але користувач намагається зайти на сторінку авторизації (/auth)
  if (token && pathname.startsWith('/auth')) {
    // Перенаправляємо його на головну сторінку системи
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 5. У всіх інших випадках (токен є і сторінка дозволена) — просто пропускаємо далі
  return NextResponse.next();
}

// Конфіг захищає всі роути, крім системних файлів Next.js
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};