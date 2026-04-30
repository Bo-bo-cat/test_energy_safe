import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // РЕЖИМ ВЕРСТКИ: 
  // Цей рядок просто каже Next.js: "Пропускай користувача далі на будь-яку сторінку"
  return NextResponse.next();
}

// Залишаємо конфіг, щоб Next.js не сварився
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};