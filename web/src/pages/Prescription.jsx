import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generatePrescription } from '../utils/ai';
import { useTranslation } from 'react-i18next';
import { Play, Pause, ChevronRight, ChevronLeft, Check, Volume2, Sprout, ShieldAlert, Droplets } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';

export default function Prescription() {
  const { plotId, readingId } = useParams(); 
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [plan, setPlan] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const synth = window.speechSynthesis;

  useEffect(() => { 
    (async () => { 
      try {
        const plotDoc = await getDoc(doc(db, 'plots', plotId));
        const readingDoc = await getDoc(doc(db, 'readings', readingId));
        if (plotDoc.exists()) {
          const rawPlan = (await generatePrescription(
            plotDoc.data(), 
            readingDoc.exists() ? readingDoc.data() : null
          )).raw_data;
          
          setPlan(rawPlan);
          buildSlides(rawPlan);
        }
      } catch (err) {
        console.error(err);
      }
    })(); 
  }, [plotId, readingId]);

  const buildSlides = (p) => {
    const newSlides = [];
    
    // Overview Slide
    newSlides.push({
      title: t('Ragi Action Plan'),
      subtitle: p.soilSpecific ? t('Verified Karnataka guidance') : t('Regional baseline not specific'),
      content: `${t('Nutrient requirement for')} ${p.areaAcres} acres. \nN: ${p.nutrientsKgHa.n} kg/ha, P: ${p.nutrientsKgHa.p2o5} kg/ha, K: ${p.nutrientsKgHa.k2o} kg/ha`,
      icon: <Sprout size={80} color="var(--brand-primary)" />,
      readText: `${t('Here is your Ragi Action Plan for')} ${p.areaAcres} acres.`
    });

    // Amendments
    if (p.amendments && p.amendments.length > 0) {
      newSlides.push({
        title: t('Soil Prep & Amendments'),
        content: p.amendments.join('\n\n'),
        icon: <Droplets size={80} color="#795548" />,
        readText: p.amendments.join('. ')
      });
    }

    // Fertilizers
    if (p.products && p.products.length > 0) {
      p.products.forEach(prod => {
        newSlides.push({
          title: `${t('Buy')}: ${prod.name}`,
          content: `${t('Total needed')}: ${prod.totalKg} kg (${prod.bags50kg} bags)\n\n${t('When how')}:\n${prod.timing}`,
          icon: <div style={{ fontSize: '80px' }}>🧪</div>,
          readText: `You need to buy ${prod.totalKg} kilograms of ${prod.name}, which is about ${prod.bags50kg} bags. Application timing: ${prod.timing}.`
        });
      });
    }

    // Tasks (grouping first 2 for brevity or just showing all)
    if (p.tasks && p.tasks.length > 0) {
      p.tasks.forEach(task => {
        newSlides.push({
          title: `${task.days[0]}–${task.days[1]} DAS`,
          subtitle: task.title,
          content: task.instruction,
          icon: <div style={{ fontSize: '80px' }}>🚜</div>,
          readText: `Between days ${task.days[0]} and ${task.days[1]}. ${task.title}. ${task.instruction}`
        });
      });
    }

    // Crop Protection
    if (p.cropProtection && p.cropProtection.length > 0) {
      newSlides.push({
        title: t('Crop Protection'),
        content: p.cropProtection.join('\n\n'),
        icon: <ShieldAlert size={80} color="#E53935" />,
        readText: p.cropProtection.join('. ')
      });
    }

    setSlides(newSlides);
  };

  useEffect(() => {
    // Stop speech when unmounting or changing slides
    synth.cancel();
    setIsPlaying(false);
  }, [currentSlide]);

  const toggleSpeech = () => {
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
    } else {
      const text = slides[currentSlide]?.readText || slides[currentSlide]?.content;
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to set local language if available, else fallback
      // utterance.lang = 'kn-IN'; // Uncomment for Kannada when translated
      utterance.onend = () => setIsPlaying(false);
      synth.speak(utterance);
      setIsPlaying(true);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  if (!plan || slides.length === 0) return <div className="container" style={{paddingTop: '20vh', textAlign: 'center'}}><h2>{t('Preparing deterministic advisory...')}</h2></div>;

  const slide = slides[currentSlide];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', 
      backgroundColor: 'var(--bg-base)', color: 'white', padding: '20px',
      maxWidth: '600px', margin: '0 auto', position: 'relative'
    }}>
      
      {/* Top bar with Language and Story Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LanguageToggle />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {slides.map((_, idx) => (
            <div key={idx} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              backgroundColor: idx <= currentSlide ? 'var(--brand-primary)' : 'rgba(255,255,255,0.2)',
              transition: 'background-color 0.3s'
            }} />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '20px', backgroundColor: 'var(--bg-surface)', borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        
        <div style={{ marginBottom: '24px' }}>
          {slide.icon}
        </div>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', lineHeight: 1.2 }}>{slide.title}</h1>
        {slide.subtitle && <h3 style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>{slide.subtitle}</h3>}
        
        <p style={{ fontSize: '1.2rem', lineHeight: 1.5, color: '#E0E0E0', whiteSpace: 'pre-line' }}>
          {slide.content}
        </p>

      </div>

      {/* Audio Button (WhatsApp Style) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-40px', zIndex: 10 }}>
        <button 
          onClick={toggleSpeech}
          style={{
            width: '80px', height: '80px', borderRadius: '50%',
            backgroundColor: isPlaying ? '#E53935' : 'var(--brand-primary)',
            color: isPlaying ? 'white' : '#1A1A1A',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isPlaying ? <Pause size={40} fill="currentColor" /> : <Volume2 size={40} />}
        </button>
      </div>

      {/* Bottom Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '20px', paddingBottom: '20px' }}>
        <button 
          onClick={prevSlide}
          disabled={currentSlide === 0}
          style={{
            padding: '16px', borderRadius: '50%', border: 'none',
            backgroundColor: currentSlide === 0 ? 'transparent' : 'rgba(255,255,255,0.1)',
            color: currentSlide === 0 ? 'transparent' : 'white',
            cursor: currentSlide === 0 ? 'default' : 'pointer',
          }}
        >
          <ChevronLeft size={32} />
        </button>
        
        <button 
          onClick={nextSlide}
          style={{
            padding: '16px 32px', borderRadius: '30px', border: 'none',
            backgroundColor: 'white', color: '#1A1A1A',
            fontSize: '1.2rem', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer'
          }}
        >
          {currentSlide === slides.length - 1 ? t('Done') : t('Next Step')}
          {currentSlide === slides.length - 1 ? <Check size={24} /> : <ChevronRight size={24} />}
        </button>
      </div>

    </div>
  );
}
