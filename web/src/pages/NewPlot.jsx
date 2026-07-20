import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { MapPin, Crosshair } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';

export default function NewPlot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [area, setArea] = useState('1');
  const [village, setVillage] = useState('Anekal');
  const [crop, setCrop] = useState('Ragi');
  const [lat, setLat] = useState('12.7089');
  const [lng, setLng] = useState('77.6968');
  const [busy, setBusy] = useState(false);
  const [waterRegime, setWaterRegime] = useState('Rainfed');
  const [sowingDate, setSowingDate] = useState('');
  const [variety, setVariety] = useState('');
  const [manureAvailable, setManureAvailable] = useState(false);
  const [priorCrop, setPriorCrop] = useState('');

  const useLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addDoc(collection(db, "plots"), {
        owner_id: user.id,
        name: name.trim(),
        crop,
        area_acres: Number(area) || 1,
        latitude: Number(lat) || 12.7089,
        longitude: Number(lng) || 77.6968,
        village,
        water_regime: waterRegime,
        sowing_date: sowingDate || null,
        variety: variety || null,
        manure_available: manureAvailable,
        prior_crop: priorCrop || null,
        region: 'Karnataka',
        created_at: new Date().toISOString(),
      });
      navigate("/");
    } catch (e) {
      alert("Error saving plot: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <LanguageToggle />
      </div>
      <h2 style={{ marginBottom: '24px' }}>{t('Register New Plot')}</h2>
      <div className="card">
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="label">{t('Plot Name')}</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={t('e.g. North Field')} required />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}><label className="label">{t('WATER REGIME')}</label><select className="input" value={waterRegime} onChange={e => setWaterRegime(e.target.value)}><option>Rainfed</option><option>Irrigated</option></select></div>
            <div style={{ flex: 1 }}><label className="label">{t('Sowing date')}</label><input className="input" type="date" value={sowingDate} onChange={e => setSowingDate(e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}><label className="label">{t('Ragi variety optional')}</label><input className="input" value={variety} onChange={e => setVariety(e.target.value)} placeholder={t('e.g. GPU 28')} /></div>
            <div style={{ flex: 1 }}><label className="label">{t('Previous crop optional')}</label><input className="input" value={priorCrop} onChange={e => setPriorCrop(e.target.value)} /></div>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={manureAvailable} onChange={e => setManureAvailable(e.target.checked)} /> {t('FYM compost available')}</label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label className="label">{t('Crop')}</label>
              <select className="input" value={crop} onChange={e => setCrop(e.target.value)}>
                <option value="Ragi">{t('Ragi Finger Millet')}</option>
                <option value="Maize">Maize</option>
                <option value="Tomato">Tomato</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">{t('Area Acres')}</label>
              <input type="number" step="0.1" className="input" value={area} onChange={e => setArea(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">{t('Village Location')}</label>
            <input className="input" value={village} onChange={e => setVillage(e.target.value)} required />
          </div>
          
          <div style={{ backgroundColor: 'var(--bg-surface-hover)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} /> {t('GPS Coordinates')}</h4>
              <button type="button" onClick={useLocation} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                <Crosshair size={16} /> {t('Locate Me')}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label className="label">{t('Latitude')}</label>
                <input className="input" value={lat} onChange={e => setLat(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">{t('Longitude')}</label>
                <input className="input" value={lng} onChange={e => setLng(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/")} style={{ flex: 1 }}>{t('Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 2 }}>{busy ? t('Saving') : t('Save Plot')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
