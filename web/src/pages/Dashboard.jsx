import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCrop } from '../context/CropContext';
import { useSoil } from '../context/SoilContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, CloudRain, Bell } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import AddAlarmModal from '../components/AddAlarmModal';

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
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', paddingBottom: '32px', position: 'relative', overflowX: 'hidden' }}>
      
      {/* 1. Header & Weather Section */}
      <div style={{ position: 'relative', width: '100%', height: '220px', backgroundImage: 'url(/terraced_crops.png)', backgroundSize: 'cover', backgroundPosition: 'center', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(84,110,63,0.85) 0%, rgba(84,110,63,0.3) 100%)', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 2, padding: '48px 24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <LanguageToggle />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', marginBottom: '-10px' }}>
            <div style={{ color: 'white' }}>
              <div style={{ fontSize: '4rem', fontWeight: '400', lineHeight: '1', display: 'flex', alignItems: 'flex-start', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                34
                <span style={{ fontSize: '1.8rem', marginTop: '6px' }}>°</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.9, marginTop: '8px' }}>
                Sonoma County
              </div>
            </div>
            <div style={{ paddingRight: '8px' }}>
              <CloudRain size={56} color="#FFF154" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-base)', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 20px', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
        
        {/* Title */}
        <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '800', marginBottom: '16px', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: '1.3' }}>
          {t(`Path A - Traditional ${cropName}, Sonoma Field 1`)}
        </h2>

        {/* Top Cards (Dial & Growth Stage) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          
          {/* Soil Diagnostics Dial */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '24px', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'white', marginBottom: '12px' }}>Soil Diagnostics</div>
            
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
                backgroundColor: '#65814C', /* Matches the card color visually */
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
                backgroundColor: 'white',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${phRotation}deg)`,
                borderRadius: '6px 6px 2px 2px',
                transition: 'transform 1s cubic-bezier(0.4, 0.0, 0.2, 1)',
                zIndex: 5,
                boxShadow: '1px 0px 4px rgba(0,0,0,0.2)'
              }}></div>
            </div>
            
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>pH {ph}</div>
          </div>

          {/* Growth Stage */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '24px', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'white', marginBottom: '8px' }}>Growth Stage</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white', marginBottom: '16px' }}>Day {currentDay}</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '6px', height: '28px' }}>
              {[1, 2, 3, 4].map((sproutIndex) => {
                const progressPercentage = currentDay / totalDays;
                const isFilled = (sproutIndex / 4) <= (progressPercentage + 0.1);
                return (
                  <Sprout 
                    key={sproutIndex}
                    size={14 + (sproutIndex * 4)} 
                    color={isFilled ? "#FFF154" : "rgba(255,255,255,0.3)"} 
                    strokeWidth={isFilled ? 2 : 1.5}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Traditional Input Levels Card 1 */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '24px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '500', color: 'white', marginBottom: '16px' }}>Traditional Input Levels</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'white', opacity: 0.9 }}>Highest Yield</span>
              <button onClick={() => setIsModalOpen(true)} style={{ background: 'none', border: 'none', color: '#FFF154', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bell size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Set Alarm</span>
              </button>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', backgroundColor: '#FFF154', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'white', opacity: 0.9 }}>Total Input Cost</span>
              <button onClick={() => setIsModalOpen(true)} style={{ background: 'none', border: 'none', color: '#FFF154', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bell size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Set Alarm</span>
              </button>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '25%', height: '100%', backgroundColor: '#FFF154', borderRadius: '4px' }}></div>
            </div>
          </div>
        </div>

        {/* Traditional Input Levels Card 2 */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '24px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '500', color: 'white', marginBottom: '12px' }}>Traditional Input Levels</h3>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px', minHeight: '36px' }}>
              <span style={{ fontSize: '0.8rem', color: 'white', opacity: 0.9, maxWidth: '200px', lineHeight: '1.4' }}>
                Ragi crop hand-weeding complete required labor
              </span>
              <button onClick={() => setIsModalOpen(true)} style={{ background: 'none', border: 'none', color: '#FFF154', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', paddingBottom: '2px' }}>
                <Bell size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Set Alarm</span>
              </button>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '85%', height: '100%', backgroundColor: '#FFF154', borderRadius: '4px' }}></div>
            </div>
          </div>
      </div>

        {/* Daily Activity Button */}
        <div style={{ marginTop: '32px', paddingBottom: '16px' }}>
          <button 
            onClick={() => navigate('/activity')}
            style={{ 
              width: '100%', 
              backgroundColor: 'var(--brand-primary)', 
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '30px',
              padding: '16px 24px',
              fontSize: '1.05rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
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
