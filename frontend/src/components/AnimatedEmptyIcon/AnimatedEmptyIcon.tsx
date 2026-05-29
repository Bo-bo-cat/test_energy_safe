'use client';
import { useState, useEffect } from 'react';
import styles from './AnimatedEmptyIcon.module.css';

// Імпорт іконок (переконайтеся, що шляхи правильні)
import { FridgeIcon } from '../icons/Fridge';
import { LaptopIcon } from '../icons/Laptop';
import { RouterIcon } from '../icons/Router';
import { LightIcon } from '../icons/Light';
import { TvIcon } from '../icons/Tv';
import { CoffeeMachineIcon } from '../icons/Coffee_Machine';
import { ChargerIcon } from '../icons/Charger';
import { ConditionerIcon } from '../icons/Conditioner';
import { DishWasherIcon } from '../icons/Dishwasher';
import { WashingMachineIcon } from '../icons/WashingMachine';
import { OtherIcon } from '../icons/Other';
import { KettleIcon } from '../icons/Kettle';
import { MicrowaweIcon } from '../icons/Microwawe';

const ICONS = [
  { id: 'fridge', Icon: FridgeIcon },
  { id: 'laptop', Icon: LaptopIcon },
  { id: 'light', Icon: LightIcon },
  { id: 'router', Icon: RouterIcon },
  { id: 'tv', Icon: TvIcon },
  { id: 'coffee_machine', Icon: CoffeeMachineIcon },
  { id: 'charger', Icon: ChargerIcon },
  { id: 'conditioner', Icon: ConditionerIcon },
  { id: 'dishwasher', Icon: DishWasherIcon },
  { id: 'washing_machine', Icon: WashingMachineIcon },
  { id: 'kettle', Icon: KettleIcon },
  { id: 'microwave', Icon: MicrowaweIcon },
  { id: 'other', Icon: OtherIcon },
];

export const AnimatedEmptyIcon = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    
    const intervalId = setInterval(() => {
      // Починаємо ховати поточну іконку за 0.5с до зміни
      setFadeState('out');
      
      setTimeout(() => {
        // Змінюємо індекс іконки
        setCurrentIndex((prevIndex) => (prevIndex + 1) % ICONS.length);
        // Знову показуємо
        setFadeState('in');
      }, 500); // Час має збігатися з часом анімації в CSS

    }, 3000); // Кожні 3 секунди (2.5с показу + 0.5с анімації)

    return () => clearInterval(intervalId);
  }, []);

  const CurrentIcon = ICONS[currentIndex].Icon;

  return (
    <div className={styles['icon-container']}>
      <div className={`${styles['icon-wrapper']} ${styles[fadeState]}`}>
        <CurrentIcon className={styles['svg-icon']} />
      </div>
    </div>
  );
};