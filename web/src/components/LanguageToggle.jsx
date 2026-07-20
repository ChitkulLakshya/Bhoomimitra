import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = ({ style = {} }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      onClick={toggleLanguage}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        padding: '6px 16px',
        cursor: 'pointer',
        color: 'white',
        fontSize: '0.85rem',
        fontWeight: '600',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        ...style
      }}
    >
      Language: {language === 'en' ? 'EN / KA' : 'KA / EN'}
    </button>
  );
};

export default LanguageToggle;
