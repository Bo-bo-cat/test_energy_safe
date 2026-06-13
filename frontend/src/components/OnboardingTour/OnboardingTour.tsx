'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Joyride, Step, STATUS } from 'react-joyride';

// Використовуємо ваш словник для підтримки двох мов
import { useTranslation } from '../../context/LanguageContext';

export const OnboardingTour = () => {
  const pathname = usePathname();
  const { lang } = useTranslation();
  
  const [steps, setSteps] = useState<Step[]>([]);
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(''); // Використовується для оновлення компонента

  useEffect(() => {
    // Запобігаємо виконанню на сервері
    if (typeof window === 'undefined') return;

    let currentSteps: Step[] = [];
    let storageKey = '';

    // 1. ТУР НА ДАШБОРДІ (ОГЛЯД МЕНЮ)
    if (pathname === '/dashboard') {
      storageKey = 'tour_dashboard_seen';
      currentSteps = [
        {
          target: 'body',
          content: lang === 'uk' ? 'Вітаємо в Energy Safe! Давайте проведемо коротку екскурсію.' : 'Welcome to Energy Safe! Let\'s take a quick tour.',
          placement: 'center',
        },
        {
          target: '#tour-nav-devices',
          content: lang === 'uk' ? 'Тут ви можете додати свої електроприлади та вказати їхню потужність.' : 'Here you can add your appliances and set their power.',
          placement: 'right',
        },
        {
          target: '#tour-nav-systems',
          content: lang === 'uk' ? 'А тут — підібрати зарядну станцію з готовими життєвими сценаріями.' : 'And here — choose a power station with ready-made scenarios.',
          placement: 'right',
        },
        {
          target: '#tour-nav-calculator',
          content: lang === 'uk' ? 'У Калькуляторі ви зможете перевірити, чи витримає система ваші прилади.' : 'In the Calculator, you can check if the system can handle your appliances.',
          placement: 'right',
        }
      ];
    } 
    // 2. ТУР НА СТОРІНЦІ ПРИЛАДІВ
    else if (pathname === '/devices') {
      storageKey = 'tour_devices_seen';
      currentSteps = [
        {
          target: '#tour-add-device',
          content: lang === 'uk' ? 'Натисніть сюди, щоб додати свій перший прилад до бази.' : 'Click here to add your first appliance to the base.',
          placement: 'bottom',
        }
      ];
    } 
    // 3. ТУР НА СТОРІНЦІ РУЧНОГО ДОДАВАННЯ (РОЗУМНИЙ ПОШУК)
    else if (pathname?.includes('/manual')) {
      storageKey = 'tour_manual_seen';
      currentSteps = [
        {
          target: '#tour-smart-search',
          content: lang === 'uk' ? 'Просто введіть назву, наприклад "Холодильник Bosch", і наш ШІ сам визначить його потужність!' : 'Just type the name, like "Bosch Fridge", and our AI will find its power!',
          placement: 'bottom',
        }
      ];
    } 
    // 4. ТУР ПО ПІДБОРУ СИСТЕМ (ГОТОВІ СЦЕНАРІЇ)
    else if (pathname === '/picker') {
      storageKey = 'tour_picker_seen';
      currentSteps = [
        {
          target: '#tour-recommended-systems',
          content: lang === 'uk' ? 'Оберіть одну з популярних систем живлення на ринку.' : 'Choose one of the popular power systems on the market.',
          placement: 'bottom',
        },
        {
          target: '#tour-system-scenarios',
          content: lang === 'uk' ? 'А потім просто оберіть готовий сценарій, який вам підходить, і збережіть його собі!' : 'And then just pick a ready scenario that suits you and save it!',
          placement: 'top',
        }
      ];
    } 
    // 5. ТУР ПО КАЛЬКУЛЯТОРУ
    else if (pathname === '/calculator') {
      storageKey = 'tour_calc_seen';
      currentSteps = [
        {
          target: '#tour-calc-devices',
          content: lang === 'uk' ? 'Оберіть прилади зі свого списку та вкажіть, скільки годин вони працюватимуть.' : 'Select appliances from your list and set how many hours they will run.',
          placement: 'right',
        },
        {
          target: '#tour-select-system',
          content: lang === 'uk' ? 'Оберіть вашу систему живлення, щоб перевірити навантаження.' : 'Select your power system to check the load.',
          placement: 'left',
        },
        {
          target: '#tour-save-scenario',
          content: lang === 'uk' ? 'Якщо розрахунок успішний — збережіть його як свій власний Готовий Сценарій!' : 'If the calculation is successful — save it as your own Ready Scenario!',
          placement: 'top',
        }
      ];
    } 
    // 6. ТУР НА СТОРІНЦІ СЦЕНАРІЇВ
    else if (pathname === '/scenarios') {
      storageKey = 'tour_scenarios_seen';
      currentSteps = [
        {
          target: '#tour-open-scenario',
          content: lang === 'uk' ? 'Натисніть сюди, щоб переглянути детальний список приладів у цьому сценарії.' : 'Click here to see the detailed list of appliances in this scenario.',
          placement: 'bottom',
        }
      ];
    } 
    // 7. ТУР НА СТОРІНЦІ ПРОФІЛЮ
    else if (pathname === '/profile') {
      storageKey = 'tour_profile_seen';
      currentSteps = [
        {
          target: '#tour-profile-faq',
          content: lang === 'uk' ? 'Якщо у вас залишилися запитання, загляньте в наш розділ відповідей (FAQ).' : 'If you have any questions left, check our FAQ section.',
          placement: 'top',
        }
      ];
    }

    // Перевіряємо, чи є кроки для цієї сторінки, і чи юзер їх ще не бачив
    if (currentSteps.length > 0 && !localStorage.getItem(storageKey)) {
      setSteps(currentSteps);
      setTourKey(storageKey);
      // Затримка 800мс, щоб сторінка встигла повністю завантажитись
      setTimeout(() => setRun(true), 800);
    } else {
      setRun(false);
    }
  }, [pathname, lang]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      // Записуємо в localStorage, що тур для ЦІЄЇ сторінки пройдено
      if (tourKey) {
        localStorage.setItem(tourKey, 'true');
      }
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
      } as any)} /* <--- ОСЬ ЦЕЙ ХАК ВИРІШУЄ ВСІ ПРОБЛЕМИ З ТИПАМИ */

      styles={{
        options: {
          primaryColor: '#FF6B00', 
          textColor: '#111827',
          backgroundColor: '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
        },
        buttonNext: {
          borderRadius: '8px',
          fontWeight: 700,
          outline: 'none',
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: '10px',
        },
        tooltipContainer: {
          textAlign: 'left'
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