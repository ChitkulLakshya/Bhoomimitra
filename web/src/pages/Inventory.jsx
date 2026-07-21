import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronDown, Bell, CheckSquare, Square, Clock, Info, BookOpen, Sparkles, Calendar, Scale } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import AddAlarmModal from '../components/AddAlarmModal';
import { useSoil } from '../context/SoilContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Inventory() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { soilData } = useSoil();

  const [expandedId, setExpandedId] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);
  const [selectedAlarmData, setSelectedAlarmData] = useState({ title: '', description: '' });
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedInfoData, setSelectedInfoData] = useState(null);

  const openInfo = (item, e) => {
    e.stopPropagation();
    setSelectedInfoData(item);
    setInfoModalOpen(true);
  };

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedId(prev => prev === id ? null : id);
  };

  const toggleCheck = (stepKey, e) => {
    e.stopPropagation();
    setCheckedSteps(prev => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const openAlarm = (title, description, e) => {
    e.stopPropagation();
    setSelectedAlarmData({ title, description });
    setAlarmModalOpen(true);
  };

  const items = [
    {
      id: 'compost',
      name: 'Eco-Compost',
      summary: '2 Sacks / Acre • Every 15 Days',
      img: '/compost_sack.png',
      timing: 'Early Morning (6:00 AM - 8:00 AM)',
      dosageDetail: 'Apply 2 full 50kg sacks per acre directly to root zones.',
      steps: [
        { id: 'c1', label: 'Verify soil moisture is at optimal level' },
        { id: 'c2', label: 'Spread compost evenly within 10cm of plant stems' },
        { id: 'c3', label: 'Mix lightly with topsoil to prevent wind erosion' },
        { id: 'c4', label: 'Irrigate field lightly within 2 hours of application' }
      ],
      info: {
        why: 'Restores organic carbon and essential microbes to the soil.',
        stageGuide: 'Vegetative Phase (Every 15 Days)',
        diyRecipe: 'Mix cow dung, dry leaves, and jaggery. Ferment for 45 days.',
        precautions: 'Do not apply during heavy rainfall to avoid runoff.'
      }
    },
    {
      id: 'seed',
      name: 'Heirloom Seeds (GPU-28)',
      summary: '1.5 kg / Acre • Sowing Phase Only',
      img: '/seed_sack.png',
      timing: 'Pre-Monsoon Sowing (Day 1 - Day 5)',
      dosageDetail: '1.5 kg per acre required. Pre-treat seeds before sowing.',
      steps: [
        { id: 's1', label: 'Soak seeds in clean water for 12 hours before planting' },
        { id: 's2', label: 'Ensure soil bed is tilled to fine tilth' },
        { id: 's3', label: 'Maintain 15cm row spacing between seeds' },
        { id: 's4', label: 'Cover seeds with 2cm layer of fine topsoil' }
      ],
      info: {
        why: 'Ensures high germination rate and early seedling immunity.',
        stageGuide: 'Sowing Phase (Day 1 - 5)',
        diyRecipe: 'Treat seeds with Beejamrut (cow urine + dung + lime) 24h before sowing.',
        precautions: 'Ensure seeds are completely dry before storage.'
      }
    },
    {
      id: 'biofert',
      name: 'Bio-Fertilizer (PSB)',
      summary: '500ml / Acre • Root Development',
      img: '/compost_sack.png',
      timing: 'Late Evening (After 5:00 PM)',
      dosageDetail: 'Mix 500ml in 100 liters of water. Drench the root zone.',
      steps: [
        { id: 'b1', label: 'Mix thoroughly with water' },
        { id: 'b2', label: 'Apply near the root zone using drip or drenching' }
      ],
      info: {
        why: 'Solubilizes soil phosphorus making it available to the plant.',
        stageGuide: 'Early Rooting Phase',
        diyRecipe: 'Commercially sourced or multiplied in jaggery solution.',
        precautions: 'Do not mix with chemical fertilizers or pesticides.'
      }
    },
    {
      id: 'panchagavya',
      name: 'Panchagavya Booster',
      summary: '3 Liters / Acre • Foliar Spray',
      img: '/seed_sack.png',
      timing: 'Early Morning before sunrise',
      dosageDetail: 'Dilute 30ml in 1 liter of water for foliar spray.',
      steps: [
        { id: 'p1', label: 'Filter the solution carefully' },
        { id: 'p2', label: 'Spray uniformly on both sides of leaves' }
      ],
      info: {
        why: 'Promotes rapid tillering, leaf greening, and drought resistance.',
        stageGuide: 'Mid-Growth Phase (Day 30 & Day 60)',
        diyRecipe: 'Blend cow dung, urine, milk, curd, and ghee. Ferment 21 days.',
        precautions: 'Stir the mixture clockwise daily during preparation.'
      }
    },
    {
      id: 'neem',
      name: 'Organic Neem Oil',
      summary: '2 Liters / Acre • Pest Protection',
      img: '/compost_sack.png',
      timing: 'Evening time to prevent leaf burn',
      dosageDetail: 'Use 3000 PPM Neem Oil. 5ml per liter of water.',
      steps: [
        { id: 'n1', label: 'Add a soap solution as an emulsifier' },
        { id: 'n2', label: 'Spray targeting stems and undersides of leaves' }
      ],
      info: {
        why: 'Natural bio-repellent for stem borer and aphid control.',
        stageGuide: 'Flowering & Grain Filling (As needed)',
        diyRecipe: 'Crush 5kg neem seeds, soak in 10L water overnight, filter.',
        precautions: 'Avoid spraying during peak sunlight.'
      }
    }
  ];

  const langSuffix = i18n.language === 'kn' ? '_kn' : '_en';
  const currentRecommendations = soilData?.[`recommendations${langSuffix}`] || soilData?.recommendations || [];
  const currentActivities = soilData?.[`detailed_daily_activities${langSuffix}`] || soilData?.detailed_daily_activities || [];
  const displayActivities = currentActivities.length > 0 ? currentActivities : items;

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', paddingBottom: '40px', color: '#1A1A1A' }}>
      
      {/* Header */}
      <div style={{ padding: '48px 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#1A1A1A', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={28} />
        </button>
        <LanguageToggle style={{ color: '#1A1A1A', border: '1px solid #EAEAEA', backgroundColor: '#F9F9F9' }} />
      </div>

      {/* 3D Burlap Sacks Hero Sticker */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0 24px 20px 24px' }}>
        <img 
          src="/burlap_sacks.png" 
          alt="Burlap Sacks" 
          style={{ width: '100%', maxWidth: '280px', height: 'auto', objectFit: 'contain' }} 
        />
      </div>

      {/* AI Recommendation Banner based on Soil Test */}
      {soilData && (
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <div style={{
            backgroundColor: '#F5F8F2',
            border: '1.5px solid #D4E157',
            borderRadius: '24px',
            padding: '16px 20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#5C763A" />
                <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#5C763A', letterSpacing: '0.3px' }}>
                  {t('AI Recommendations')}
                </span>
              </div>
            </div>
            {currentRecommendations && currentRecommendations.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', fontSize: '0.85rem', lineHeight: '1.5' }}>
                {currentRecommendations.map((rec, i) => (
                  <li key={i}>{t(rec)}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#444', margin: 0, lineHeight: '1.45' }}>
                {soilData.ph < 6.5
                  ? t('Soil is slightly acidic (pH {{ph}}). Applied 0.5kg Lime treatment step to Eco-Compost routine.', { ph: soilData.ph })
                  : soilData.nitrogen < 50
                  ? t('Soil Nitrogen is low ({{n}} mg/kg). Daily Activity auto-boosted to 3 Eco-Compost sacks.', { n: soilData.nitrogen })
                  : t('Soil Health Score is Optimal (pH {{ph}}, N {{n}} mg/kg). Standard eco-activity plan active.', { ph: soilData.ph, n: soilData.nitrogen })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Single Grouped Card Container */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '32px',
          padding: '20px 16px 16px 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}>

          {displayActivities.map((item, index) => {
            const isExpanded = expandedId === item.id;
            return (
              <React.Fragment key={item.id}>
                {index > 0 && (
                  <div style={{ height: '1px', backgroundColor: '#EAEAEA', margin: '16px 0' }}></div>
                )}

                <div>
                  {/* Header Row */}
                  <div 
                    onClick={(e) => toggleExpand(item.id, e)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 4px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '52px', height: '52px', 
                        backgroundColor: 'var(--bg-base)', 
                        borderRadius: '18px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A', margin: '0 0 4px 0' }}>{t(item.name)}</h4>
                        <p style={{ fontSize: '0.82rem', color: '#667757', margin: 0, fontWeight: '500' }}>
                          {t(item.summary)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Expand Arrow Button */}
                    <div 
                      onClick={(e) => toggleExpand(item.id, e)}
                      style={{ 
                        width: '34px', height: '34px', 
                        borderRadius: '50%', 
                        backgroundColor: isExpanded ? '#D4E157' : '#5C763A', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={20} color="#1A1A1A" />
                      ) : (
                        <ChevronRight size={18} color="#FFFFFF" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Accordion Panel */}
                  {isExpanded && (
                    <div style={{ 
                      marginTop: '16px', 
                      backgroundColor: '#F5F8F2', 
                      borderRadius: '20px', 
                      padding: '16px',
                      border: '1px solid #EAEAEA',
                      animation: 'fadeIn 0.3s ease'
                    }}>
                      
                      {/* Detailed Dosage & Timing */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#5C763A', fontWeight: '700', marginBottom: '4px' }}>
                          <Info size={14} />
                          <span>{t('Detailed Instruction & Dosage')}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#333', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                          {t(item.dosageDetail)}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#555' }}>
                          <Clock size={13} color="#5C763A" />
                          <span>{t('Recommended Time:')} {t(item.timing)}</span>
                        </div>
                        {item.quantity_per_acre && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#555', marginTop: '4px' }}>
                            <Scale size={13} color="#5C763A" />
                            <span>{t('Quantity:')} {item.quantity_per_acre}</span>
                          </div>
                        )}
                        {item.duration_days && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#555', marginTop: '4px' }}>
                            <Calendar size={13} color="#5C763A" />
                            <span>{t('Duration:')} {item.duration_days}</span>
                          </div>
                        )}
                      </div>

                      {/* Application Checklist */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1A1A1A', marginBottom: '10px' }}>
                          {t('Application Checklist:')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {item.steps.map((step) => {
                            const isChecked = !!checkedSteps[step.id];
                            return (
                              <div 
                                key={step.id} 
                                onClick={(e) => toggleCheck(step.id, e)}
                                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
                              >
                                {isChecked ? (
                                  <CheckSquare size={18} color="#5C763A" style={{ flexShrink: 0, marginTop: '2px' }} />
                                ) : (
                                  <Square size={18} color="#CCC" style={{ flexShrink: 0, marginTop: '2px' }} />
                                )}
                                <span style={{ fontSize: '0.82rem', color: isChecked ? '#999' : '#1A1A1A', textDecoration: isChecked ? 'line-through' : 'none', lineHeight: '1.4' }}>
                                  {t(step.label)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button 
                          onClick={(e) => openInfo(item, e)}
                          style={{
                            flex: 1,
                            backgroundColor: 'white',
                            color: '#1A1A1A',
                            border: '1px solid #CCC',
                            borderRadius: '14px',
                            padding: '12px',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <BookOpen size={16} />
                          {t('Know More')}
                        </button>

                        <button 
                          onClick={(e) => openAlarm(`Apply ${t(item.name)}`, t(item.dosageDetail), e)}
                          style={{
                            flex: 1,
                            backgroundColor: '#D4E157',
                            color: '#1A1A1A',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '12px',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                        >
                          <Bell size={16} />
                          {t('Set Alarm')}
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Alarm Modal Pre-filled */}
      <AddAlarmModal 
        isOpen={alarmModalOpen} 
        onClose={() => setAlarmModalOpen(false)}
        initialTitle={selectedAlarmData.title}
        initialDescription={selectedAlarmData.description}
      />

      {/* Educational Info Modal */}
      {infoModalOpen && selectedInfoData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '400px', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <button onClick={() => setInfoModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#1A1A1A', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '16px' }}>{t(selectedInfoData.name)} {t('Guide')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#5C763A', marginBottom: '4px' }}>{t("Why it's essential")}</h4>
              <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.4', margin: 0 }}>{t(selectedInfoData.info.why)}</p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#5C763A', marginBottom: '4px' }}>{t('Stage Guide')}</h4>
              <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.4', margin: 0 }}>{t(selectedInfoData.info.stageGuide)}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#5C763A', marginBottom: '4px' }}>{t('DIY Recipe')}</h4>
              <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.4', margin: 0 }}>{t(selectedInfoData.info.diyRecipe)}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#5C763A', marginBottom: '4px' }}>{t('Precautions')}</h4>
              <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.4', margin: 0 }}>{t(selectedInfoData.info.precautions)}</p>
            </div>
            
            <button onClick={() => setInfoModalOpen(false)} style={{ width: '100%', backgroundColor: '#D4E157', color: '#1A1A1A', borderRadius: '16px', padding: '12px', fontWeight: '700', border: 'none', cursor: 'pointer', marginTop: '8px' }}>{t('Close Guide')}</button>
          </div>
        </div>
      )}

    </div>
  );
}
