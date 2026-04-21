import React from 'react';

export function CheckboxIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill-rule="evenodd" clip-rule="evenodd" d="M512 28C512 12.536 499.464 0 484 0H28C12.536 0 0 12.536 0 28V484C0 499.464 12.536 512 28 512H484C499.464 512 512 499.464 512 484V28ZM48 76C48 60.536 60.536 48 76 48H436C451.464 48 464 60.536 464 76V436C464 451.464 451.464 464 436 464H76C60.536 464 48 451.464 48 436V76Z" 
      fill="currentColor"/>
    </svg>
  );
}