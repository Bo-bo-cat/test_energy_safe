// src/components/icons/LightningIcon.tsx
import React from 'react';

export function LaptopIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 512 409"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ⚠️ Заміни path на свій з файлу, якщо він відрізняється, 
          і ОБОВ'ЯЗКОВО напиши fill="currentColor" */}
      <path d="M512 322.928V335.33C512 375.529 479.771 408.262 439.572 408.262H72.4258C32.2289 408.262 0 375.529 0 335.33V322.928H512ZM440.889 0C458.879 0 473.516 14.637 473.516 32.6279V260.183C473.516 278.173 458.879 292.81 440.889 292.81H69.4385C51.4485 292.81 36.8115 278.173 36.8115 260.183V32.627C36.8116 14.637 51.4485 0 69.4385 0H440.889Z" 
      fill="currentColor"/>
    </svg>
  );
}