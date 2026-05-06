import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // 1. Отримуємо токен з кукі
  const token = request.cookies.get('access_token')?.value;

  // 2. Отримуємо поточний шлях (URL), куди намагається перейти користувач
  const { pathname } = request.nextUrl;

  // 3. Визначаємо, чи є сторінка публічною (Лендінг '/' або сторінки '/auth')
  const isPublicPage = pathname === '/' || pathname.startsWith('/auth');

  // 4. Якщо токена НЕМАЄ, і користувач намагається зайти на закриту сторінку
  if (!token && !isPublicPage) {
    // Перенаправляємо його на сторінку авторизації
    const authUrl = new URL('/auth', request.url);
    return NextResponse.redirect(authUrl);
  }

  // 5. Якщо токен Є, але користувач намагається зайти на Лендінг або Авторизацію
  if (token && isPublicPage) {
    // Перенаправляємо його одразу в робочий кабінет (дашборд)
    // Увага: переконайся, що твій дашборд тепер лежить за адресою /dashboard
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 6. У всіх інших випадках (токен є і сторінка дозволена) — просто пропускаємо далі
  return NextResponse.next();
}

// Конфіг захищає всі роути, крім системних файлів Next.js
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};