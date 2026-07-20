import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = ({ style = {} }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div 
      onClick={toggleLanguage}
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '20px',
        padding: '4px',
        cursor: 'pointer',
        position: 'relative',
        minWidth: '80px',
        height: '40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flexShrink: 0,
        ...style
      }}
    >
      <div style={{
        position: 'absolute',
        left: language === 'en' ? '4px' : 'calc(50% + 2px)',
        width: 'calc(50% - 8px)',
        height: '32px',
        backgroundColor: 'white',
        borderRadius: '16px',
        transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }} />
      <span style={{ 
        flex: 1, 
        textAlign: 'center', 
        zIndex: 1, 
        fontSize: '0.75rem', 
        fontWeight: '700', 
        color: language === 'en' ? '#688C31' : '#999', 
        transition: 'color 0.3s ease',
        whiteSpace: 'nowrap'
      }}>EN</span>
      <span style={{ 
        flex: 1, 
        textAlign: 'center', 
        zIndex: 1, 
        fontSize: '0.75rem', 
        fontWeight: '700', 
        color: language === 'kn' ? '#688C31' : '#999', 
        transition: 'color 0.3s ease',
        whiteSpace: 'nowrap'
      }}>ಕನ್ನಡ</span>
    </div>
  );
};

export default LanguageToggle;
