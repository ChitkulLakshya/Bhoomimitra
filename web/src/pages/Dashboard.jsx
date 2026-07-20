import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCrop } from '../context/CropContext';
import { useSoil } from '../context/SoilContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, Bell } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import AddAlarmModal from '../components/AddAlarmModal';
import WeatherWidget from '../components/WeatherWidget';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { activeCrop } = useCrop();
  const { soilData } = useSoil();

  const ph = soilData?.ph || 6.8;
  const phPercentage = Math.max(0, Math.min(1, (ph - 4) / (10 - 4)));
  const phRotation = -90 + (phPercentage * 180);

  const cropName = activeCrop?.name || 'Rice';
  const currentDay = activeCrop?.currentDay || 40;
  const totalDays = activeCrop?.totalDays || 120;

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
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px 0 24px' }}>
          <LanguageToggle style={{ color: '#1A1A1A', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }} />
        </div>

        <WeatherWidget />
      </div>

      <div style={{ padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {/* Title */}
        <h2 style={{ color: '#1A1A1A', fontSize: '1.3rem', fontWeight: '800', marginBottom: '16px', lineHeight: '1.3' }}>
          {t(`Path A - Traditional ${cropName}, Sonoma Field 1`)}
        </h2>

        {/* Top Cards (Dial & Growth Stage) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          
          {/* Soil Diagnostics Dial */}
          <div style={{ backgroundColor: '#F5F8F2', borderRadius: '24px', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555', marginBottom: '12px' }}>Soil Diagnostics</div>
            
            <div style={{ position: 'relative', width: '120px', height: '60px', margin: '0 auto 12px auto' }}>
              {/* Outer 5-color arc */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: '120px 120px 0 0',
                background: 'conic-gradient(from 270deg at 50% 100%, #db5346 0deg, #db5346 36deg, #f3a033 36deg, #f3a033 72deg, #95cd5b 72deg, #95cd5b 108deg, #41a656 108deg, #41a656 144deg, #257d82 144deg, #257d82 180deg)',
              }}></div>
              
              {/* Inner cutout */}
              <div style={{
                position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: '80px', height: '40px',
                backgroundColor: '#F5F8F2',
                borderRadius: '80px 80px 0 0'
              }}></div>

              {/* 6.8 Text Overlay on Light Green */}
              <div style={{
                position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                fontSize: '0.65rem', fontWeight: 'bold', color: 'white', opacity: 0.9, zIndex: 3
              }}>
                6.8
              </div>

              {/* Needle */}
              <div style={{
                position: 'absolute', bottom: '-4px', left: '50%',
                width: '6px', height: '45px',
                backgroundColor: '#333',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${phRotation}deg)`,
                borderRadius: '6px 6px 2px 2px',
                transition: 'transform 1s cubic-bezier(0.4, 0.0, 0.2, 1)',
                zIndex: 5,
                boxShadow: '1px 0px 4px rgba(0,0,0,0.2)'
              }}></div>
            </div>
            
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A' }}>pH {ph}</div>
          </div>

          {/* Growth Stage */}
          <div style={{ backgroundColor: '#F5F8F2', borderRadius: '24px', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Growth Stage</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '16px' }}>Day {currentDay}</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '6px', height: '28px' }}>
              {[1, 2, 3, 4].map((sproutIndex) => {
                const progressPercentage = currentDay / totalDays;
                const isFilled = (sproutIndex / 4) <= (progressPercentage + 0.1);
                return (
                  <Sprout 
                    key={sproutIndex}
                    size={14 + (sproutIndex * 4)} 
                    color={isFilled ? "#5C763A" : "#D0D8CC"} 
                    strokeWidth={isFilled ? 2.5 : 2}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Traditional Input Levels Card 1 */}
        <div style={{ backgroundColor: '#F5F8F2', borderRadius: '24px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>Traditional Input Levels</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: '600' }}>Highest Yield</span>
              <button onClick={() => setIsModalOpen(true)} style={{ background: 'none', border: 'none', color: '#E59F00', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bell size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>Set Alarm</span>
              </button>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8DF', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', backgroundColor: '#5C763A', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: '600' }}>Total Input Cost</span>
              <button onClick={() => setIsModalOpen(true)} style={{ background: 'none', border: 'none', color: '#E59F00', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bell size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>Set Alarm</span>
              </button>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8DF', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '25%', height: '100%', backgroundColor: '#5C763A', borderRadius: '4px' }}></div>
            </div>
          </div>
        </div>

        {/* Traditional Input Levels Card 2 */}
        <div style={{ backgroundColor: '#F5F8F2', borderRadius: '24px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>Traditional Input Levels</h3>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px', minHeight: '36px' }}>
              <span style={{ fontSize: '0.8rem', color: '#555', fontWeight: '600', maxWidth: '200px', lineHeight: '1.4' }}>
                Ragi crop hand-weeding complete required labor
              </span>
              <button onClick={() => setIsModalOpen(true)} style={{ background: 'none', border: 'none', color: '#E59F00', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', paddingBottom: '2px' }}>
                <Bell size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>Set Alarm</span>
              </button>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8DF', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '85%', height: '100%', backgroundColor: '#5C763A', borderRadius: '4px' }}></div>
            </div>
          </div>
      </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '32px', paddingBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button 
            onClick={() => navigate('/scan')}
            style={{ 
              width: '100%', 
              backgroundColor: 'white', 
              color: 'var(--brand-primary)',
              border: '2px solid var(--brand-primary)',
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
              backgroundColor: 'var(--brand-primary)', 
              color: '#1A1A1A',
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

      <AddAlarmModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
