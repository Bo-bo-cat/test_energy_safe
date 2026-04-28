// src/components/icons/LightningIcon.tsx
import React from 'react';

export function PenIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 512 512"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ⚠️ Заміни path на свій з файлу, якщо він відрізняється, 
          і ОБОВ'ЯЗКОВО напиши fill="currentColor" */}
      <path d="M135.243 489.987L17.7304 511.749C12.8796 512.648 7.88944 511.104 4.39255 507.607C0.899553 504.114 -0.648048 499.124 0.250952 494.267L22.0117 376.747L135.243 489.987ZM456.691 178.567L161.482 473.798L38.1982 350.505L333.407 55.2729L456.691 178.567ZM372.779 15.8989C393.977 -5.29913 428.467 -5.30012 449.667 15.8989L496.062 62.2983C517.313 83.5493 517.31 117.944 496.062 139.193L477.903 157.354L354.619 34.059L372.779 15.8989Z" 
      fill="currentColor"/>
    </svg>
  );
}