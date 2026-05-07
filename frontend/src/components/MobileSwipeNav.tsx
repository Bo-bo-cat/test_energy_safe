'use client';
import { useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './MobileSwipeNav.module.css';

// Точний порядок сторінок, як у твоєму сайдбарі (layout.tsx)
const ROUTES = [
  '/dashboard',   // Головна
  '/devices',     // Прилади
  '/calculator',  // Розрахунок
  '/scenarios',   // Сценарії
  '/picker',      // Система
  '/profile'      // Профіль
];

export const MobileSwipeNav = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);
  const minSwipeDistance = 70; 

  // --- СТЕЙТИ ДЛЯ АНІМАЦІЇ ---
  const [animClass, setAnimClass] = useState('');
  const isSwipeTriggered = useRef(false); // Запам'ятовує, чи зміна сторінки викликана свайпом
  const prevPathname = useRef(pathname);

  // Спрацьовує ЩОРАЗУ, коли змінюється сторінка
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Якщо перехід був саме через свайп — вмикаємо анімацію
      if (isSwipeTriggered.current) {
        const oldIndex = ROUTES.indexOf(prevPathname.current);
        const newIndex = ROUTES.indexOf(pathname);

        // Визначаємо напрямок виїзду нової сторінки
        if (newIndex > oldIndex) {
          setAnimClass(styles['slide-in-right']);
        } else {
          setAnimClass(styles['slide-in-left']);
        }

        // Прибираємо клас анімації через 300мс (коли вона закінчилась)
        const timer = setTimeout(() => {
          setAnimClass('');
        }, 300);

        isSwipeTriggered.current = false; // Скидаємо прапорець
        prevPathname.current = pathname;
        return () => clearTimeout(timer);
      }
      
      // Якщо це був звичайний клік по меню — просто оновлюємо шлях без анімації
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // --- ЛОГІКА СВАЙПІВ ---
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;

    if (typeof window !== 'undefined' && window.innerWidth > 950) return;

    const target = e.target as Element;
    if (target.closest('.no-swipe')) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY) * 1.5;

    if (isHorizontalSwipe) {
      const isLeftSwipe = distanceX > minSwipeDistance;
      const isRightSwipe = distanceX < -minSwipeDistance;
      const currentIndex = ROUTES.indexOf(pathname);

      if (currentIndex !== -1) {
        if (isLeftSwipe && currentIndex < ROUTES.length - 1) {
          isSwipeTriggered.current = true; // Кажемо React: "Це свайп!"
          router.push(ROUTES[currentIndex + 1]);
        }
        if (isRightSwipe && currentIndex > 0) {
          isSwipeTriggered.current = true; // Кажемо React: "Це свайп!"
          router.push(ROUTES[currentIndex - 1]);
        }
      }
    }
  };

  return (
    <div 
      className={`${styles.navContainer} ${animClass}`}
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
};