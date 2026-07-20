import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Image as ImageIcon, Camera, ScanLine, X, Zap, ShieldAlert, RefreshCw } from 'lucide-react';
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch plots for user
  useEffect(() => {
    const fetchPlots = async () => {
      if (!user?.id) return;
      try {
        const q = query(collection(db, 'plots'), where('owner_id', '==', user.id));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (data.length > 0) {
          setPlotId(data[0].id);
        } else {
          setPlotId('default_plot');
        }
      } catch (err) {
        console.warn("Plot fetch warning:", err);
        setPlotId('default_plot');
      }
    };

    fetchPlots();
  }, [user]);

  // Request & Start Live Camera Stream
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Camera access warning:", err);
      setCameraActive(false);
      setCameraError(t('Camera permission is required for live scanning. You can grant access or select an image file from your device.'));
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Process image data (either from live canvas or file input)
  const processBase64Image = (base64Data) => {
    navigate('/analyzing', { state: { base64Data } });
  };

  // Capture frame from Live Video Feed
  const handleCapturePhoto = () => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) {
      // Fallback to file picker if camera is not running
      fileInputRef.current?.click();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert frame to Base64 (held in-memory temporarily)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64Data = dataUrl.split(',')[1];

    processBase64Image(base64Data);
  };

  // Handle Gallery/File Picker Selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result;
          if (typeof res !== 'string') return reject(new Error('Failed to read image.'));
          resolve(res.split(',')[1]);
        };
        reader.onerror = () => reject(new Error('Failed to read image.'));
        reader.readAsDataURL(file);
      });

      processBase64Image(base64Data);
    } catch (err) {
      setError(t('Unable to read selected image.'));
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0D130B', display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Hidden Temporary Canvas for Snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Header */}
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'white', zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <X size={28} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>{t('Scan Soil Health Card')}</h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
            {busy ? `${scanStage || t('Scanning')} · ${scanProgress}%` : t('Position card inside the frame')}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <LanguageToggle />
        </div>
      </div>

      {/* Camera Viewport & Live Stream */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        
        {/* Live Video Feed Element */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: cameraActive ? 'block' : 'none'
          }}
        />



        {error && (
          <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', backgroundColor: '#D9534F', color: 'white', padding: '14px', borderRadius: '16px', textAlign: 'center', zIndex: 50, fontWeight: '600' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Bounding Box Frame Overlay */}
        {cameraActive && (
          <div style={{ 
            width: '300px', 
            height: '300px', 
            border: '2px solid rgba(255,255,255,0.6)', 
            borderRadius: '28px',
            position: 'relative',
            zIndex: 10,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)'
          }}>
            {/* Corner accents */}
            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '32px', height: '32px', borderTop: '4px solid #D4E157', borderLeft: '4px solid #D4E157', borderTopLeftRadius: '28px' }}></div>
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '32px', height: '32px', borderTop: '4px solid #D4E157', borderRight: '4px solid #D4E157', borderTopRightRadius: '28px' }}></div>
            <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '32px', height: '32px', borderBottom: '4px solid #D4E157', borderLeft: '4px solid #D4E157', borderBottomLeftRadius: '28px' }}></div>
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '32px', height: '32px', borderBottom: '4px solid #D4E157', borderRight: '4px solid #D4E157', borderBottomRightRadius: '28px' }}></div>
          </div>
        )}
      </div>

      {/* Floating Bottom Shutter Bar */}
      <div style={{ 
        position: 'absolute',
        bottom: '36px',
        left: '0',
        right: '0',
        padding: '0 40px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        zIndex: 100
      }}>
        {/* Gallery Upload Button */}
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={busy}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          <ImageIcon size={24} />
        </button>

        {/* Primary Camera Shutter Button */}
        <button 
          onClick={handleCapturePhoto} 
          disabled={busy}
          style={{ 
            background: 'white', 
            border: '6px solid rgba(212, 225, 87, 0.5)', 
            backgroundClip: 'padding-box',
            borderRadius: '50%', 
            width: '84px', 
            height: '84px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#1C2B14', 
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            transition: 'transform 0.15s ease'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Camera size={36} color="#1C2B14" />
        </button>

        {/* Scan Mode Toggle */}
        <button 
          onClick={startCamera}
          disabled={busy}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          <ScanLine size={24} />
        </button>
      </div>
    </div>
  );
}