import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { analyzeCard } from '../utils/ai';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';

export default function Analyzing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const processed = useRef(false);
  const base64Data = location.state?.base64Data;
  const [statusText, setStatusText] = useState('Initializing AI pipeline...');

  useEffect(() => {
    if (!base64Data) {
      navigate('/scan');
      return;
    }
    
    if (processed.current) return;
    processed.current = true;

    const processData = async () => {
      try {
        const result = await analyzeCard(base64Data, (update) => {
          if (update && update.message) setStatusText(update.message);
        }, i18n.language);
        
        const payload = {
          userId: user?.id || 'anonymous',
          ph: result.ph || 6.8,
          nitrogen: result.nitrogen || 45,
          phosphorus: result.phosphorus || 20,
          potassium: result.potassium || 110,
          recommendations: result.recommendations || [],
          detailed_daily_activities: result.detailed_daily_activities || [],
          testedAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'soil_tests'), payload);
        navigate('/inventory');
      } catch (err) {
        console.error("AI failed:", err);
        alert("Failed to analyze card. Please try again.");
        navigate('/scan');
      }
    };

    processData();
  }, [base64Data, navigate, user]);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <DotLottieReact
        src="https://lottie.host/be488a8d-fbbb-4467-bb02-0d1db42aa84c/HmdbgcttOa.lottie"
        loop
        autoplay
        style={{ width: '300px', height: '300px' }}
      />
      <div style={{ marginTop: '24px', fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A', textAlign: 'center', padding: '0 24px', lineHeight: '1.5' }}>
        {statusText}
      </div>
    </div>
  );
}
