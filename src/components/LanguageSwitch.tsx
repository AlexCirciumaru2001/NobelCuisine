import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ro' ? 'en' : 'ro');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors"
      title={language === 'ro' ? 'Switch to English' : 'Schimbă în Română'}
    >
      <Globe className="h-5 w-5" />
      <span className="text-sm font-medium uppercase">{language === 'ro' ? 'EN' : 'RO'}</span>
    </button>
  );
}