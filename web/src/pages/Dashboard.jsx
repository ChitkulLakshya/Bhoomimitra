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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { activeCrop } = useCrop();
  const { soilData } = useSoil();

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanStage, setScanStage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = React.useRef(null);

  const ph = soilData?.ph || 6.8;
  const phPercentage = Math.max(0, Math.min(1, (ph - 4) / (10 - 4)));
  const phRotation = -90 + (phPercentage * 180);

  const cropName = activeCrop?.name || 'Rice';
  const currentDay = activeCrop?.currentDay || 40;
  const totalDays = activeCrop?.totalDays || 120;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true); setScanProgress(0); setScanStage('Compressing image...'); setError('');
    try {
      const { compressImageToWebP } = await import('../utils/imageUtils');
      const base64Data = await compressImageToWebP(file, 1200, 0.7);

      setScanStage('Analyzing via Gemini...');
      const { analyzeCard } = await import('../utils/ai');
      const result = await analyzeCard(base64Data, (update) => {
        if (typeof update === 'number') setScanProgress(Math.round(update * 100));
        if (update && typeof update === 'object') {
          if (typeof update.progress === 'number') setScanProgress(Math.max(0, Math.min(100, Math.round(update.progress * 100))));
          if (update.message) setScanStage(update.message);
        }
      });
      // Fetch or create plotId
      const { collection, query, where, getDocs, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const q = query(collection(db, 'plots'), where('owner_id', '==', user.id));
      const snap = await getDocs(q);
      let targetPlotId = '';
      if (!snap.empty) {
        targetPlotId = snap.docs[0].id;
      } else {
        const newPlot = await addDoc(collection(db, 'plots'), {
          owner_id: user.id,
          name: 'My Farm',
          area_acres: 1,
          crop: 'ragi',
          water_regime: 'rainfed',
          created_at: new Date().toISOString()
        });
        targetPlotId = newPlot.id;
      }

      navigate(`/verify/${targetPlotId}`, { state: { scannedData: result } });
    } catch (err) {
      console.error(err);
      setError(t('Failed to analyze the card.'));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ backgroundColor: '#FDFDFD', minHeight: '100vh', paddingBottom: '32px', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Farm Background Header */}
      <div style={{ 
        position: 'absolute', 
        top: 0, left: 0, right: 0, 
        height: '240px', 
        backgroundImage: 'url(/terraced_crops.png)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        zIndex: 0 
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(84,110,63,0.5) 0%, rgba(84,110,63,0.1) 100%)' }}></div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top utility bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px 0 24px' }}>
          <LanguageToggle style={{ color: '#1A1A1A', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }} />
        </div>
      </div>

      <div style={{ padding: '0 20px', position: 'relative', zIndex: 10, marginTop: '20px' }}>
        
        {/* Title */}
        <h2 style={{ color: '#FFFFFF', fontSize: '1.8rem', fontWeight: '800', marginBottom: '24px', lineHeight: '1.3', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          {t('My Farm')}
        </h2>

        {!soilData ? (
          <div style={{ backgroundColor: '#F5F8F2', borderRadius: '24px', padding: '32px 20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
            <Sprout size={48} color="#5C763A" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>{t('Welcome to Bhoomimitra')}</h3>
            <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>
              {t('Scan your Soil Health Card to generate a personalized, audio-guided farming plan for your crop.')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            {/* Soil Diagnostics Dial */}
            <div style={{ backgroundColor: '#F5F8F2', borderRadius: '24px', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555', marginBottom: '12px' }}>Soil Diagnostics</div>
              
              <div style={{ position: 'relative', width: '120px', height: '60px', margin: '0 auto 12px auto' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: '120px 120px 0 0',
                  background: 'conic-gradient(from 270deg at 50% 100%, #db5346 0deg, #db5346 36deg, #f3a033 36deg, #f3a033 72deg, #95cd5b 72deg, #95cd5b 108deg, #41a656 108deg, #41a656 144deg, #257d82 144deg, #257d82 180deg)',
                }}></div>
                <div style={{
                  position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '80px', height: '40px',
                  backgroundColor: '#F5F8F2',
                  borderRadius: '80px 80px 0 0'
                }}></div>
                <div style={{
                  position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                  fontSize: '0.65rem', fontWeight: 'bold', color: 'white', opacity: 0.9, zIndex: 3
                }}>
                  {ph}
                </div>
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

            {/* Active Crop */}
            <div style={{ backgroundColor: '#F5F8F2', borderRadius: '24px', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Active Crop</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '16px' }}>{cropName}</div>
              <button 
                onClick={() => navigate('/prescription')}
                style={{ background: 'none', border: 'none', color: '#5C763A', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                View Plan
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            disabled={busy}
            style={{ 
              width: '100%', 
              backgroundColor: busy ? '#999' : 'var(--brand-primary)', 
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '30px',
              padding: '20px 12px',
              fontSize: '1.1rem',
              fontWeight: '800',
              cursor: busy ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {busy ? `${scanStage || t('Analyzing...')} · ${scanProgress}%` : t('Scan Card')}
          </button>
        </div>

      </div>

      <AddAlarmModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
