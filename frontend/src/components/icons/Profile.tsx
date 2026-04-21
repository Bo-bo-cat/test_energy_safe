// src/components/icons/LightningIcon.tsx
import React from 'react';

export function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 412 512"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ⚠️ Заміни path на свій з файлу, якщо він відрізняється, 
          і ОБОВ'ЯЗКОВО напиши fill="currentColor" */}
      <path d="M206 278.548C319.588 278.548 412 370.959 412 484.548C412 499.387 399.97 511.417 385.131 511.417H26.8691C12.0303 511.417 0.000230785 499.387 0 484.548C0 370.959 92.4116 278.548 206 278.548ZM206 0C267.983 0 318.406 50.4234 318.406 112.404C318.406 174.385 267.983 224.809 206 224.809C144.017 224.809 93.5939 174.385 93.5938 112.404C93.5938 50.4234 144.017 2.21655e-05 206 0Z" 
      fill="currentColor"/>
    </svg>
  );
}