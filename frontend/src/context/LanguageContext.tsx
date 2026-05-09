'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { uk } from '../locales/uk';
import { en } from '../locales/en';

type Language = 'uk' | 'en';
type Dictionary = typeof uk;

interface LanguageContextType {
  lang: Language;
  t: Dictionary;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('uk');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang === 'uk' || savedLang === 'en') {
      setLang(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'uk' ? 'en' : 'uk';
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  const t = lang === 'uk' ? uk : en;

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};