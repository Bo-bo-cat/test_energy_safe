import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Намагаємося дістати токен із кук
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Якщо токена немає і юзер НЕ на сторінці auth — перекидаємо на /auth
  if (!token && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // 2. Якщо токен є і юзер намагається зайти на /auth — перекидаємо на головну
  if (token && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Вказуємо, які шляхи перевіряти
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};