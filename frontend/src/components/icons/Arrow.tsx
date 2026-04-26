import React from 'react';

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 544 512"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ⚠️ Заміни path на свій з файлу, якщо він відрізняється, 
          і ОБОВ'ЯЗКОВО напиши fill="currentColor" */}
      <path d="M340.528 38.9613L532.697 391.778C564.26 444.879 525.979 512 464.169 512L79.8245 512C17.9625 512 -20.2503 444.825 11.3123 391.778L203.472 38.9613C234.389 -13.0216 309.653 -12.9526 340.528 38.9613Z" 
      fill="currentColor"/>
    </svg>
  );
}