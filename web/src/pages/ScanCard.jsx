import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { analyzeCard } from '../utils/ai';
import { Image as ImageIcon, Camera, ScanLine, X, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';

export default function ScanCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [plotId, setPlotId] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchPlots = async () => {
      const q = query(collection(db, 'plots'), where('owner_id', '==', user.id));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (data.length > 0) setPlotId(data[0].id);
    };

    fetchPlots();
  }, [user.id]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!plotId) {
      setError(t('Please select a plot first.'));
      return;
    }

    setBusy(true);
    setScanProgress(0);
    setScanStage('Initializing Scanner...');
    setError('');

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== 'string') {
            reject(new Error('Unable to read the selected image.'));
            return;
          }

          resolve(result.split(',')[1]);
        };

        reader.onerror = () => reject(new Error('Unable to read the selected image.'));
        reader.readAsDataURL(file);
      });

      const result = await analyzeCard(base64Data, (update) => {
        if (typeof update === 'number') {
          setScanProgress(Math.round(update * 100));
          return;
        }

        if (update && typeof update === 'object') {
          if (typeof update.progress === 'number') {
            setScanProgress(Math.max(0, Math.min(100, Math.round(update.progress * 100))));
          }

          if (update.message) {
            setScanStage(update.message);
          }
        }
      });

      navigate(`/verify/${plotId}`, { state: { scannedData: result } });
    } catch {
      setError(t('Failed to analyze the card. Please try again with a clearer photo.'));
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Top Header */}
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'white', zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <X size={28} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '4px' }}>{t('Scan Item')}</h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
            {busy ? `${scanStage || t('Scanning')} · ${scanProgress}%` : t('Place item inside the frame')}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>
            {t('Offline OCR runs on your device')}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <LanguageToggle />
          <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} />
          </button>
        </div>
      </div>

      {/* Camera Viewport (Simulated) & Scanner Frame */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error && (
          <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', backgroundColor: 'var(--error)', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', zIndex: 50 }}>
            {error}
          </div>
        )}

        {/* Bounding Box Frame */}
        <div style={{ 
          width: '280px', 
          height: '280px', 
          border: '2px solid rgba(255,255,255,0.8)', 
          borderRadius: '24px',
          position: 'relative'
        }}>
          {/* Corner accents */}
          <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '30px', height: '30px', borderTop: '4px solid white', borderLeft: '4px solid white', borderTopLeftRadius: '24px' }}></div>
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '30px', height: '30px', borderTop: '4px solid white', borderRight: '4px solid white', borderTopRightRadius: '24px' }}></div>
          <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '30px', height: '30px', borderBottom: '4px solid white', borderLeft: '4px solid white', borderBottomLeftRadius: '24px' }}></div>
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '30px', height: '30px', borderBottom: '4px solid white', borderRight: '4px solid white', borderBottomRightRadius: '24px' }}></div>

          {/* Scanning Animation Line */}
          {busy && <div style={{ width: '100%', height: '2px', backgroundColor: 'var(--brand-primary)', position: 'absolute', top: '50%', boxShadow: '0 0 10px var(--brand-primary)' }}></div>}

          {busy && (
            <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '16px', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>{scanStage || 'Scanning...'}</div>
              <div style={{ height: '6px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                <div style={{ width: `${scanProgress}%`, height: '100%', borderRadius: '999px', backgroundColor: 'var(--brand-primary)', transition: 'width 150ms ease' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div style={{ 
        position: 'absolute',
        bottom: '32px',
        left: '0',
        right: '0',
        padding: '0 40px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        zIndex: 100
      }}>
        {/* Gallery Upload */}
        <button 
          onClick={() => { fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click(); }} 
          disabled={busy}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          <ImageIcon size={24} />
        </button>

        {/* Big Camera Shutter */}
        <button 
          onClick={() => { fileInputRef.current.setAttribute('capture', 'environment'); fileInputRef.current.click(); }} 
          disabled={busy}
          style={{ 
            background: 'white', 
            border: '6px solid rgba(255,255,255,0.3)', 
            backgroundClip: 'padding-box',
            borderRadius: '50%', 
            width: '80px', 
            height: '80px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--text-primary)', 
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
          }}
        >
          <Camera size={32} />
        </button>

        {/* Scan/OCR Mode */}
        <button 
          disabled={busy}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          <ScanLine size={24} />
        </button>

      </div>
    </div>
  );
}