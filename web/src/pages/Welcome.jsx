import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import i18n from '../i18n';

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-base)',
      backgroundImage: `url('/terraced_crops.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      
      {/* Gradient Overlay for Text Readability and Blending */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'linear-gradient(to bottom, rgba(84,110,63,1) 0%, rgba(84,110,63,0.9) 30%, rgba(84,110,63,0.3) 60%, rgba(84,110,63,0) 100%)', 
        zIndex: 1 
      }}></div>

      {/* Top Section */}
      <div style={{ position: 'relative', zIndex: 2, padding: '48px 24px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        
        {/* Language Toggle */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <LanguageToggle />
        </div>

        {/* Hero Text */}
        <h1 style={{
          fontSize: '2.4rem', fontWeight: '800', color: 'white',
          lineHeight: '1.15', marginBottom: '16px', letterSpacing: '-0.5px',
          maxWidth: '340px'
        }}>
          {t('Optimize Your Farm with Multiple Success Paths')}
        </h1>
        <p style={{
          fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)',
          lineHeight: '1.5', fontWeight: '500', maxWidth: '320px',
          marginBottom: '32px'
        }}>
          {t('Create multiple growing plans and combinations without guesswork. Simple, prioritized data for your success.')}
        </p>

        {/* Action Button */}
        <button 
          onClick={() => navigate('/auth')}
          style={{
            backgroundColor: 'var(--brand-primary)',
            color: '#1A1A1A',
            border: 'none',
            borderRadius: '30px',
            padding: '16px 48px',
            fontSize: '1.1rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            minWidth: '220px'
          }}
        >
          {t('Get Started')}
        </button>
      </div>

      {/* 3D Character Asset */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', flex: 1, overflow: 'hidden' }}>
        <img 
          src="/welcome_farmer.png" 
          alt="Friendly Farmer" 
          style={{ 
            width: '100%', 
            maxWidth: '500px',
            objectFit: 'contain',
            marginBottom: '-5%',
            transform: 'scale(1.1)'
          }} 
        />
      </div>

    </div>
  );
}
