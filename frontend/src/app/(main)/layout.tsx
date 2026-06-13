'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './layout.module.css';
import { Toaster } from 'react-hot-toast'; 

import { LightningIcon } from '../../components/icons/Lightning';
import { HomeIcon } from '../../components/icons/Home';
import { DeviceIcon } from '../../components/icons/Device';
import { CalcIcon } from '../../components/icons/Calc';
import { ScenarioIcon } from '../../components/icons/Scenario';
import { SystemIcon } from '../../components/icons/System';
import { ProfileIcon } from '../../components/icons/Profile';
import { LogOutIcon } from '../../components/icons/LogOut';
import { LogInIcon } from '../../components/icons/Log-in'; 

import { DecisionModal } from '../../components/DecisionModal/DecisionModal' ;
import { MobileSwipeNav } from '../../components/MobileSwipeNav/MobileSwipeNav';
import { LanguageProvider, useTranslation } from '../../context/LanguageContext';

import { InstallPrompt } from '../../components/InstallPrompt/InstallPrompt';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation(); 
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // ДОДАНО: властивість tourId для інтерактивного онбордингу
  const navItems = [
    { href: '/dashboard', label: t.sidebar.home, Icon: HomeIcon, tourId: 'tour-nav-home' },
    { href: '/devices', label: t.sidebar.devices, Icon: DeviceIcon, tourId: 'tour-nav-devices' },
    { href: '/calculator', label: t.sidebar.calculator, Icon: CalcIcon, tourId: 'tour-nav-calculator' },
    { href: '/scenarios', label: t.sidebar.scenarios, Icon: ScenarioIcon, tourId: 'tour-nav-scenarios' },
    { href: '/picker', label: t.sidebar.system, Icon: SystemIcon, tourId: 'tour-nav-systems' }, 
    { href: '/profile', label: t.sidebar.profile, Icon: ProfileIcon, tourId: 'tour-nav-profile' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = 'access_token=; path=/; max-age=0';
    router.push('/auth');
  };

  const handleAuthClick = () => {
    if (isLoggedIn) {
      setShowLogoutModal(true); 
    } else {
      router.push('/auth'); 
    }
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
                id={item.tourId} /* ДОДАНО: ID для react-joyride */
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
          <button onClick={handleAuthClick} className={styles['logout-btn']}>
            <div className={styles['icon-wrapper']}>
              {isLoggedIn ? (
                <LogOutIcon className={styles['nav-icon']} />
              ) : (
                <LogInIcon className={styles['nav-icon']} />
              )}
            </div>
            {isLoggedIn ? t.sidebar.logout : ((t.sidebar as any)?.login || 'Увійти')}
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

      <InstallPrompt />
      
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            fontWeight: 600,
          },
          success: {
            iconTheme: { primary: 'var(--accent-orange)', secondary: '#fff' },
          }
        }}
      />
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