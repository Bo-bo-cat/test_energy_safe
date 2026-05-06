'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './layout.module.css';

// Імпорт іконок
import { LightningIcon } from '../../components/icons/Lightning';
import { HomeIcon } from '../../components/icons/Home';
import { DeviceIcon } from '../../components/icons/Device';
import { CalcIcon } from '../../components/icons/Calc';
import { ScenarioIcon } from '../../components/icons/Scenario';
import { SystemIcon } from '../../components/icons/System';
import { ProfileIcon } from '../../components/icons/Profile';
import { LogOutIcon } from '../../components/icons/LogOut';

// Імпорт модалки
import { DecisionModal } from '../../components/DecisionModal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Стейт для теми
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Стейт для модалки логауту
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Перевірка збереженої теми при завантаженні
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Функція перемикання теми
  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Головна', Icon: HomeIcon },
    { href: '/devices', label: 'Прилади', Icon: DeviceIcon },
    { href: '/calculator', label: 'Розрахунок', Icon: CalcIcon },
    { href: '/scenarios', label: 'Сценарії', Icon: ScenarioIcon },
    { href: '/picker', label: 'Система', Icon: SystemIcon }, 
    { href: '/profile', label: 'Профіль', Icon: ProfileIcon },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    document.cookie = 'access_token=; path=/; max-age=0';
    router.push('/auth');
  };

  return (
    <div className={styles['layout-container']}>
      <aside className={styles['sidebar']}>
        <div className={styles['logo-container']}>
          <LightningIcon className={styles['logo-icon']} />
          <div className={styles['logo-text']}>Energy Safe</div>
        </div>

        <nav className={styles['nav-menu']}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.Icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`${styles['nav-link']} ${isActive ? styles['nav-link-active'] : ''}`}
              >
                <div className={styles['icon-wrapper']}>
                   <IconComponent className={styles['nav-icon']} />
                </div>
                {/* Обернули текст, щоб його можна було приховати */}
                <span className={styles['nav-text']}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Секція нижніх кнопок (притиснута до низу) */}
        <div className={styles['logout-section']}>
          
          {/* Перемикач теми */}
          <div className={styles['theme-toggle-row']} onClick={toggleTheme}>
            <span>Темна тема</span>
            <div className={`${styles['toggle-switch']} ${isDarkMode ? styles['active'] : ''}`}>
              <div className={styles['toggle-knob']}></div>
            </div>
          </div>

          {/* Кнопка виходу (відкриває модалку) */}
          <button onClick={() => setShowLogoutModal(true)} className={styles['logout-btn']}>
            <div className={styles['icon-wrapper']}>
              <LogOutIcon className={styles['nav-icon']} />
            </div>
            Вийти
          </button>

        </div>
      </aside>

      <main className={styles['main-content']}>
        {children}
      </main>

      {/* Модалка підтвердження виходу */}
      <DecisionModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Вийти з акаунту?"
      />
    </div>
  );
}