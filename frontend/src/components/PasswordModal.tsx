'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './layout.module.css';

import { LightningIcon } from '../../components/icons/Lightning';
import { HomeIcon } from '../../components/icons/Home';
import { DeviceIcon } from '../../components/icons/Device';
import { CalcIcon } from '../../components/icons/Calc';
import { ScenarioIcon } from '../../components/icons/Scenario';
import { SystemIcon } from '../../components/icons/System';
import { ProfileIcon } from '../../components/icons/Profile';
import { LogOutIcon } from '../../components/icons/LogOut';

import { DecisionModal } from '../../components/DecisionModal';
import { MobileSwipeNav } from '../../components/MobileSwipeNav';
import { LanguageProvider, useTranslation } from '../../context/LanguageContext';

// НОВЕ: Імпорт модалки встановлення
import { InstallPrompt } from '../../components/InstallPrompt/InstallPrompt';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation(); 
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

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
    { href: '/dashboard', label: t.sidebar.home, Icon: HomeIcon },
    { href: '/devices', label: t.sidebar.devices, Icon: DeviceIcon },
    { href: '/calculator', label: t.sidebar.calculator, Icon: CalcIcon },
    { href: '/scenarios', label: t.sidebar.scenarios, Icon: ScenarioIcon },
    { href: '/picker', label: t.sidebar.system, Icon: SystemIcon }, 
    { href: '/profile', label: t.sidebar.profile, Icon: ProfileIcon },
  ];

  const handleLogout = () => {
    localStorage.clear();
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
                <span className={styles['nav-text']}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles['logout-section']}>
          <div className={styles['theme-toggle-row']} onClick={toggleTheme}>
            <span>{t.sidebar.darkMode}</span>
            <div className={`${styles['toggle-switch']} ${isDarkMode ? styles['active'] : ''}`}>
              <div className={styles['toggle-knob']}></div>
            </div>
          </div>

          <button onClick={() => setShowLogoutModal(true)} className={styles['logout-btn']}>
            <div className={styles['icon-wrapper']}>
              <LogOutIcon className={styles['nav-icon']} />
            </div>
            {t.sidebar.logout}
          </button>
        </div>
      </aside>

      <main className={styles['main-content']}>
        <MobileSwipeNav>
          {children}
        </MobileSwipeNav>
      </main>

      <DecisionModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title={t.sidebar.logoutConfirm}
        confirmText={t.common.yes}
        cancelText={t.common.no}
      />

      {/* НОВЕ: Компонент встановлення */}
      <InstallPrompt />
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </LanguageProvider>
  );
}