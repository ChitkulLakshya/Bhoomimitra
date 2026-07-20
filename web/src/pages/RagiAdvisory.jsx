import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Sprout, ScanLine, CalendarDays, PackageCheck, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buildRagiPlan } from '../utils/ragiEngine';
import { InteractiveMenu } from '../components/InteractiveMenu';

export default function RagiAdvisory() {
  const navigate = useNavigate(); const { t } = useTranslation();
  const [area, setArea] = useState('1'); const [waterRegime, setWaterRegime] = useState('Rainfed'); const [sowingDate, setSowingDate] = useState('');
  const plan = buildRagiPlan({ area_acres: Number(area) || 1, water_regime: waterRegime, sowing_date: sowingDate || null });
  return <div style={{ minHeight: '100vh', background: '#F5F7F2', paddingBottom: 80 }}>
    <section style={{ minHeight: 280, padding: '32px 24px', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, color: 'white', backgroundImage: 'linear-gradient(110deg, rgba(35,70,26,.92), rgba(74,107,34,.58)), url(/field_aerial.png)', backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#D9EDC9', fontWeight: 800, fontSize: '.85rem' }}><Sprout size={17} /> {t('DETERMINISTIC ADVISORY')}</div>
      <h1 style={{ fontSize: '2.55rem', lineHeight: 1.05, margin: '18px 0 10px', letterSpacing: '-1px' }}>{t('YOUR RAGI ACTION PLAN')}</h1>
      <p style={{ maxWidth: 330, lineHeight: 1.5, margin: 0, fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>{t('RagiAdvisorySubtitle')}</p>
    </section>
    <main style={{ margin: '-42px 24px 0', position: 'relative', zIndex: 2, maxWidth: 800 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 18, boxShadow: '0 12px 30px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#4A6B22', fontWeight: 800 }}><CalendarDays size={19} /> {t('Tell us about this crop')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 12 }}>
          <label style={{ fontSize: '.78rem', fontWeight: 800, color: '#688C31' }}>{t('AREA (ACRES)')}<input style={inputStyle} type="number" min=".01" step=".01" value={area} onChange={(e) => setArea(e.target.value)} /></label>
          <label style={{ fontSize: '.78rem', fontWeight: 800, color: '#688C31' }}>{t('WATER REGIME')}<select style={inputStyle} value={waterRegime} onChange={(e) => setWaterRegime(e.target.value)}><option>Rainfed</option><option>Irrigated</option></select></label>
          <label style={{ fontSize: '.78rem', fontWeight: 800, color: '#688C31' }}>{t('SOWING DATE (OPTIONAL)')}<input style={inputStyle} type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} /></label>
        </div>
      </div>
      <div style={{ background: '#EAF3E2', borderLeft: '4px solid #688C31', borderRadius: 16, padding: 16, marginTop: 16, color: '#35531B' }}><b>{t('Regional baseline')}</b><div style={{ marginTop: 5, fontSize: '.88rem' }}>{plan.warnings[0].includes('Regional baseline') ? t('warning_regional_baseline') : plan.warnings[0].includes('STCR') ? t('warning_stcr_disabled') : plan.warnings[0].includes('Verified soil categories') ? t('warning_verified_categories', { n: plan.warnings[0].match(/N (\w+)/)?.[1] || '', p: plan.warnings[0].match(/P (\w+)/)?.[1] || '', k: plan.warnings[0].match(/K (\w+)/)?.[1] || '' }) : plan.warnings[0]}</div></div>
      <h2 style={headingStyle}>{t('Nutrient requirement')}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
        {[['N', plan.nutrientsKgHa.n, '#E7F1E0'], ['P₂O₅', plan.nutrientsKgHa.p2o5, '#F7E9D7'], ['K₂O', plan.nutrientsKgHa.k2o, '#E4EEF6']].map(([label, amount, bg]) => <div key={label} style={{ background: bg, borderRadius: 18, padding: 14, textAlign: 'center' }}><div style={{ fontWeight: 800, color: '#4A6B22' }}>{label}</div><div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1A1A1A' }}>{amount}</div><small>kg/ha</small></div>)}
      </div>
      <h2 style={headingStyle}>{t('What to use')}</h2>{plan.products.map((item) => <div key={item.id} style={{ background: 'white', borderRadius: 18, padding: 16, marginBottom: 10, boxShadow: '0 4px 15px rgba(0,0,0,.03)', borderLeft: '4px solid #688C31' }}><div style={{ display: 'flex', gap: 9, alignItems: 'center', color: '#4A6B22' }}><PackageCheck size={20} /><b>{t(`product_${item.id}`)}</b></div><p style={{ margin: '9px 0 4px', color: '#333', fontWeight: 700 }}>{item.totalKg} kg total · {item.bags50kg} × 50 kg bags</p><small style={{ color: '#666' }}>{t(`timing_${item.id}_${waterRegime}`)}</small></div>)}
      <div style={{ background: 'white', borderRadius: 18, padding: 16, marginTop: 16 }}><b style={{ color: '#4A6B22' }}>{t('Next task')}: {plan.tasks[0].title}</b><p style={{ marginBottom: 0, color: '#555' }}>{plan.tasks[0].instruction}</p></div>
      <button type="button" onClick={() => navigate('/')} style={{ width: '100%', marginTop: 18, border: 'none', padding: 15, borderRadius: 16, background: '#688C31', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}><ScanLine size={19} style={{ verticalAlign: 'middle', marginRight: 8 }} />{t('Scan verify Soil Health Card')}</button>
    </main>
  </div>;
}
const inputStyle = { display: 'block', boxSizing: 'border-box', width: '100%', border: '1px solid #DCE5D4', borderRadius: 11, marginTop: 6, padding: '11px 10px', background: '#F7F9F5', color: '#1A1A1A', fontSize: '1rem' };
const headingStyle = { fontSize: '1.1rem', fontWeight: 800, color: '#1A1A1A', margin: '24px 0 12px' };
const navButton = (active) => ({ border: 'none', display: 'flex', alignItems: 'center', gap: 7, background: active ? '#688C31' : 'white', color: active ? 'white' : '#4A6B22', padding: '12px 16px', borderRadius: 24, fontWeight: 800, cursor: 'pointer' });
