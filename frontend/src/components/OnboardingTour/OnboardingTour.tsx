'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Joyride, STATUS } from 'react-joyride';
import { useTranslation } from '../../context/LanguageContext';

export const OnboardingTour = () => {
  const pathname = usePathname();
  const { lang } = useTranslation();
  
  // Використовуємо any[], щоб TypeScript не сварився на disableBeacon
  const [steps, setSteps] = useState<any[]>([]);
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let currentSteps: any[] = [];
    // Додаємо суфікс _v2, щоб скинути старі збереження туру для тестування
    let storageKey = ''; 

    if (pathname === '/dashboard') {
      storageKey = 'tour_dashboard_seen_v2';
      currentSteps = [
        {
          target: 'body',
          content: lang === 'uk' ? 'Вітаємо в Energy Safe! Давайте проведемо коротку екскурсію.' : 'Welcome to Energy Safe! Let\'s take a quick tour.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '#tour-nav-devices',
          content: lang === 'uk' ? 'Тут ви можете додати свої електроприлади та вказати їхню потужність.' : 'Here you can add your appliances and set their power.',
          placement: 'right',
          disableBeacon: true,
        },
        {
          target: '#tour-nav-systems',
          content: lang === 'uk' ? 'А тут — керувати своїми станціями або підібрати готові сценарії.' : 'And here — manage your stations or choose ready-made scenarios.',
          placement: 'right',
          disableBeacon: true,
        },
        {
          target: '#tour-nav-calculator',
          content: lang === 'uk' ? 'У Калькуляторі ви зможете перевірити, чи витримає система ваші прилади.' : 'In the Calculator, you can check if the system can handle your appliances.',
          placement: 'right',
          disableBeacon: true,
        }
      ];
    } 
    else if (pathname === '/devices') {
      storageKey = 'tour_devices_seen_v2';
      currentSteps = [
        {
          target: '#tour-add-device',
          content: lang === 'uk' ? 'Натисніть сюди, щоб додати свій перший прилад до бази.' : 'Click here to add your first appliance to the base.',
          placement: 'bottom',
          disableBeacon: true,
        }
      ];
    } 
    else if (pathname?.includes('/manual')) {
      storageKey = 'tour_manual_seen_v2';
      currentSteps = [
        {
          target: '#tour-smart-search',
          content: lang === 'uk' ? 'Просто введіть назву, наприклад "Холодильник Bosch", і наш ШІ сам визначить його потужність!' : 'Just type the name, like "Bosch Fridge", and our AI will find its power!',
          placement: 'bottom',
          disableBeacon: true,
        }
      ];
    } 
    else if (pathname === '/picker') {
      storageKey = 'tour_picker_seen_v2';
      currentSteps = [
        {
          target: '#tour-recommended-systems',
          content: lang === 'uk' ? 'Оберіть одну з популярних систем живлення на ринку.' : 'Choose one of the popular power systems on the market.',
          placement: 'bottom',
          disableBeacon: true,
        },
        {
          target: '#tour-system-scenarios',
          content: lang === 'uk' ? 'А потім просто оберіть готовий сценарій, який вам підходить, і збережіть його собі!' : 'And then just pick a ready scenario that suits you and save it!',
          placement: 'top',
          disableBeacon: true,
        }
      ];
    } 
    else if (pathname === '/calculator') {
      storageKey = 'tour_calc_seen_v2';
      currentSteps = [
        {
          target: '#tour-calc-devices',
          content: lang === 'uk' ? 'Оберіть прилади зі свого списку та вкажіть, скільки годин вони працюватимуть.' : 'Select appliances from your list and set how many hours they will run.',
          placement: 'right',
          disableBeacon: true,
        },
        {
          target: '#tour-select-system',
          content: lang === 'uk' ? 'Оберіть вашу систему живлення, щоб перевірити навантаження.' : 'Select your power system to check the load.',
          placement: 'left',
          disableBeacon: true,
        },
        {
          target: '#tour-save-scenario',
          content: lang === 'uk' ? 'Якщо розрахунок успішний — збережіть його як свій власний Готовий Сценарій!' : 'If the calculation is successful — save it as your own Ready Scenario!',
          placement: 'top',
          disableBeacon: true,
        }
      ];
    } 
    else if (pathname === '/scenarios') {
      storageKey = 'tour_scenarios_seen_v2';
      currentSteps = [
        {
          target: '#tour-open-scenario',
          content: lang === 'uk' ? 'Натисніть сюди, щоб переглянути детальний список приладів у цьому сценарії.' : 'Click here to see the detailed list of appliances in this scenario.',
          placement: 'bottom',
          disableBeacon: true,
        }
      ];
    } 
    else if (pathname === '/profile') {
      storageKey = 'tour_profile_seen_v2';
      currentSteps = [
        {
          target: '#tour-profile-faq',
          content: lang === 'uk' ? 'Якщо у вас залишилися запитання, загляньте в наш розділ відповідей (FAQ).' : 'If you have any questions left, check our FAQ section.',
          placement: 'top',
          disableBeacon: true,
        }
      ];
    }

    // ЛОГІКА ПЕРЕВІРКИ
    if (currentSteps.length > 0 && !localStorage.getItem(storageKey)) {
      setSteps(currentSteps);
      setTourKey(storageKey);
      
      // Зберігаємо флаг ВІДРАЗУ перед запуском туру. 
      // Тепер оновлення сторінки не викличе тур повторно.
      localStorage.setItem(storageKey, 'true');
      
      setTimeout(() => setRun(true), 800);
    } else {
      setRun(false);
    }
  }, [pathname, lang]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    }
  };

  if (!run || steps.length === 0) return null;

  return (
    <Joyride
      key={tourKey}
      steps={steps}
      run={run}
      continuous={true}
      callback={handleJoyrideCallback}
      {...({
        showProgress: true,
        showSkipButton: true,
        disableOverlayClose: true,
      } as any)}
      styles={{
        options: {
          primaryColor: '#FF6B00',
          textColor: '#111827',
          backgroundColor: '#FFFFFF',
          overlayColor: 'rgba(17, 24, 39, 0.6)', /* М'якший темний фон */
          zIndex: 10000,
        },
        tooltip: {
          fontFamily: 'inherit', /* Підтягує ваш шрифт */
          borderRadius: '16px',  /* Заокруглення як у ваших карток */
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        },
        tooltipContainer: {
          textAlign: 'left',
          fontFamily: 'inherit',
        },
        tooltipContent: {
          fontFamily: 'inherit',
          fontSize: '15px',
          padding: '10px 0',
          lineHeight: '1.5',
        },
        buttonNext: {
          backgroundColor: '#FF6B00',
          color: '#FFFFFF',
          borderRadius: '10px',
          fontWeight: 700,
          fontFamily: 'inherit',
          padding: '10px 20px',
          border: 'none',
          outline: 'none',
        },
        buttonBack: {
          color: '#6B7280',
          fontFamily: 'inherit',
          fontWeight: 600,
          marginRight: '16px',
        },
        buttonSkip: {
          color: '#9CA3AF',
          fontFamily: 'inherit',
          fontWeight: 600,
          fontSize: '14px',
        }
      } as any}
      locale={{
        last: lang === 'uk' ? 'Зрозуміло' : 'Got it',
        skip: lang === 'uk' ? 'Пропустити' : 'Skip',
        next: lang === 'uk' ? 'Далі' : 'Next',
        back: lang === 'uk' ? 'Назад' : 'Back'
      }}
    />
  );
};