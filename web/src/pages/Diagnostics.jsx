import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Sprout } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { useSoil } from '../context/SoilContext';
import { useCrop } from '../context/CropContext';

export default function Diagnostics() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { soilData } = useSoil();
  const { activeCrop } = useCrop();

  const ph = soilData?.ph || 6.8;
  const n = soilData?.nitrogen || 40;
  const p = soilData?.phosphorus || 20;
  const k = soilData?.potassium || 100;

  // Helpers for chart logic
  // Assume optimal N=50, P=40, K=50. Max for charts = 120.
  const nPercent = Math.min(100, (n / 100) * 100);
  const pPercent = Math.min(100, (p / 80) * 100);
  const kPercent = Math.min(100, (k / 150) * 100);

  // pH Dial rotation: pH 0 (left) to pH 14 (right). 
  // Dial spans 180 degrees (-90 to +90). 
  // We'll restrict to standard ag range 4 to 9 for better visual representation.
  const minPh = 4;
  const maxPh = 10;
  const phPercentage = Math.max(0, Math.min(1, (ph - minPh) / (maxPh - minPh)));
  const phRotation = -90 + (phPercentage * 180);

  // Generate dynamic recommendation
  let recommendation = "";
  if (n < 45) recommendation += "Nitrogen levels are low. Consider adding organic compost or urea. ";
  if (p < 30) recommendation += "Phosphorus is deficient. Apply rock phosphate or DAP to boost root growth. ";
  if (k < 80) recommendation += "Potassium is slightly low. Potash application is recommended. ";
  if (recommendation === "") recommendation = "Your soil nutrients look optimal! Keep monitoring moisture levels.";

  const cropName = activeCrop?.name || 'Crop';
  const currentDay = activeCrop?.currentDay || 0;
  const totalDays = activeCrop?.totalDays || 120;

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* Header & Background */}
      <div style={{ position: 'relative', width: '100%', height: '220px', backgroundImage: 'url(/terraced_crops.png)', backgroundSize: 'cover', backgroundPosition: 'center', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(78,107,62,0.85) 0%, rgba(78,107,62,0.3) 100%)', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 2, padding: '48px 24px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={28} />
          </button>
          <LanguageToggle />
        </div>
      </div>

      <div style={{ padding: '24px', marginTop: '-60px', position: 'relative', zIndex: 10 }}>
        
        {/* Title */}
        <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '800', marginBottom: '16px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {t(`Path A - Traditional ${cropName}, Field 1`)}
        </h2>

        {/* Top Cards (Dial & Growth Stage) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          
          {/* Soil Diagnostics Dial */}
          <div style={{ backgroundColor: '#677a50', borderRadius: '24px', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
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
                backgroundColor: '#677a50',
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
          <div style={{ backgroundColor: '#677a50', borderRadius: '24px', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
                    color={isFilled ? "#95cd5b" : "#ffffff"} 
                    strokeWidth={isFilled ? 2 : 1.5}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Soil Analysis (Screen 5 component integrated) */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-20px', position: 'relative', zIndex: 5 }}>
            <img src="/soil_tester.png" alt="3D Soil Tester" style={{ width: '120px' }} />
          </div>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '24px', padding: '36px 20px 20px 20px', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-inverse)', textAlign: 'center', marginBottom: '20px' }}>Soil Analysis - Detailed View</h3>
            
            {/* N-P-K Bar Chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '140px', borderLeft: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', marginBottom: '20px', position: 'relative' }}>
              
              {/* Target lines indicator */}
              <div style={{ position: 'absolute', top: '20%', left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.2)' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '30%' }}>
                <div style={{ width: '24px', height: `${nPercent}%`, backgroundColor: nPercent < 45 ? 'var(--error)' : 'var(--success)', borderRadius: '4px 4px 0 0', transition: 'height 1s ease' }}></div>
                <div style={{ marginTop: '8px', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)' }}>{n} mg</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '30%' }}>
                <div style={{ width: '24px', height: `${pPercent}%`, backgroundColor: pPercent < 30 ? 'var(--warning)' : 'var(--success)', borderRadius: '4px 4px 0 0', transition: 'height 1s ease' }}></div>
                <div style={{ marginTop: '8px', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)' }}>{p} mg</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '30%' }}>
                <div style={{ width: '24px', height: `${kPercent}%`, backgroundColor: kPercent < 80 ? 'var(--warning)' : 'var(--success)', borderRadius: '4px 4px 0 0', transition: 'height 1s ease' }}></div>
                <div style={{ marginTop: '8px', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)' }}>{k} mg</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', color: 'var(--text-inverse)', fontSize: '0.9rem', fontWeight: '800', marginTop: '-12px', marginBottom: '24px' }}>
              <span style={{ width: '30%', textAlign: 'center' }}>N</span>
              <span style={{ width: '30%', textAlign: 'center' }}>P</span>
              <span style={{ width: '30%', textAlign: 'center' }}>K</span>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-inverse)', marginBottom: '8px' }}>Soil Test Recommendations</h4>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', fontWeight: '500', marginBottom: '24px' }}>
              {recommendation}
            </p>

            <button 
              onClick={() => navigate('/inventory')}
              className="btn btn-primary" 
              style={{ width: '100%', color: '#1A1A1A', borderRadius: '16px' }}
            >
              View Inventory & Compare Paths
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
