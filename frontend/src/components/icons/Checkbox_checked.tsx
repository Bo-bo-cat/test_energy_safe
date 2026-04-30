import React from 'react';

// Використовуємо іменований експорт, як і в інших іконках
export function CheckboxCheckedIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" /* Тепер тут точно 24x24, як у Figma */
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        // Шлях (path) взято прямо з вашого Checkbox-checkedIcons.svg
        d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" 
        // fill="currentColor" дозволяє змінювати колір іконки через CSS (як і раніше)
        fill="currentColor" 
      />
    </svg>
  );
}