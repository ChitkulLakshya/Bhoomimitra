import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import AddAlarmModal from '../components/AddAlarmModal';
import WeatherWidget from '../components/WeatherWidget';
import InlineAlarmCard from '../components/InlineAlarmCard';
import ProfileModal from '../components/ProfileModal';
import SavedAlarmsList from '../components/SavedAlarmsList';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const openAlarmFor = (title) => {
    setModalTitle(title);
    setIsModalOpen(true);
  };
  
  return (
    <div style={{ backgroundColor: '#FDFDFD', minHeight: '100vh', paddingBottom: '32px', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Farm Background Header */}
      <div style={{ 
        position: 'absolute', 
        top: 0, left: 0, right: 0, 
        height: '320px', 
        backgroundImage: 'url(/terraced_crops.png)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        zIndex: 0 
      }}>
        {/* Subtle overlay to ensure widget stands out */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(84,110,63,0.5) 0%, rgba(84,110,63,0.1) 100%)' }}></div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top utility bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 0 24px' }}>
          {/* User Profile Thumbnail */}
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            style={{
              width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', border: '2px solid white',
              cursor: 'pointer', transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img src="/expert_avatar.png" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <LanguageToggle style={{ color: '#1A1A1A', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }} />
        </div>

        <WeatherWidget />
      </div>

      <div style={{ padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {/* Personalized Greeting */}
        <div 
          onClick={() => setIsProfileModalOpen(true)}
          style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: '0.95rem', color: '#8A9E79', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {new Date().toLocaleDateString(i18n.language === 'kn' ? 'kn-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>
            {t('Hello')}, {user?.name || 'Farmer'} 👋
          </h2>
          <div style={{ fontSize: '1.05rem', color: '#5C763A', fontWeight: '700' }}>
            {user?.phone || '+91 -'}
          </div>
        </div>

        {/* Custom Green Alarm Interface Card */}
        <InlineAlarmCard />

        {/* List of Saved Alarms (Toggles & Delete) */}
        <SavedAlarmsList />

        {/* Action Buttons */}
        <div style={{ marginTop: '32px', paddingBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button 
            onClick={() => navigate('/scan')}
            style={{ 
              width: '100%', 
              backgroundColor: 'white', 
              color: '#5C763A',
              border: '2px solid #5C763A',
              borderRadius: '30px',
              padding: '16px 12px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            {t('Scan Card')}
          </button>
          
          <button 
            onClick={() => navigate('/activity')}
            style={{ 
              width: '100%', 
              backgroundColor: '#5C763A', 
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              padding: '16px 12px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {t('Daily Activity')}
          </button>
        </div>

      </div>

      <AddAlarmModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialTitle={modalTitle}
      />

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
