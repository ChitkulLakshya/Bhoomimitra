import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Cloud, MapPin, RefreshCw, Home, Sprout, Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getBrowserLocation, getCachedWeatherReport, getFallbackLocation, getWeatherReportWithFallback, formatWeatherTime } from '../utils/weather';
import { InteractiveMenu } from '../components/InteractiveMenu';

export default function Dashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [weather, setWeather] = useState(getCachedWeatherReport());
  const [weatherLoading, setWeatherLoading] = useState(!getCachedWeatherReport());
  const [weatherRefreshing, setWeatherRefreshing] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const currentDate = new Date().toLocaleDateString(i18n.language === 'kn' ? 'kn-IN' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
  });

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      const cachedWeather = getCachedWeatherReport();
      setWeatherRefreshing(true);
      if (!cachedWeather) {
        setWeatherLoading(true);
      }
      setWeatherError('');

      let coords = null;

      try {
        coords = await getBrowserLocation();
      } catch {
        try {
          const q = query(collection(db, 'plots'), where('owner_id', '==', user.id));
          const snap = await getDocs(q);
          const firstPlot = snap.docs[0]?.data();

          if (firstPlot?.latitude != null && firstPlot?.longitude != null) {
            coords = {
              latitude: Number(firstPlot.latitude),
              longitude: Number(firstPlot.longitude),
            };
          }
        } catch {
          // Ignore plot lookup failures and fall back below.
        }

        if (!coords && cachedWeather?.latitude != null && cachedWeather?.longitude != null) {
          coords = {
            latitude: cachedWeather.latitude,
            longitude: cachedWeather.longitude,
          };
        }

        if (!coords) {
          coords = getFallbackLocation();
        }
      }

      const report = await getWeatherReportWithFallback(coords);

      if (cancelled) return;

      setWeather(report);
      setWeatherError(report.source === 'fallback' ? report.error || t('Weather unavailable') : '');
      setWeatherLoading(false);
      setWeatherRefreshing(false);
    };

    loadWeather().catch((error) => {
      if (cancelled) return;

      const cached = getCachedWeatherReport();
      if (cached) {
        setWeather(cached);
        setWeatherError(t('Showing cached weather'));
      } else {
        setWeatherError(error.message || t('Weather unavailable'));
      }

      setWeatherLoading(false);
      setWeatherRefreshing(false);
    });

    // Open-Meteo current conditions are model-backed and updated regularly.
    // Refresh periodically so the dashboard does not become a stale snapshot.
    const refreshTimer = setInterval(() => {
      loadWeather().catch(() => {
        // The existing cache/fallback state remains visible if refresh fails.
      });
    }, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(refreshTimer);
    };
  }, [t, user.id]);

  const refreshWeather = async () => {
    setWeatherRefreshing(true);
    setWeatherError('');

    try {
      const coords = await getBrowserLocation().catch(async () => {
        try {
          const q = query(collection(db, 'plots'), where('owner_id', '==', user.id));
          const snap = await getDocs(q);
          const firstPlot = snap.docs[0]?.data();

          if (firstPlot?.latitude != null && firstPlot?.longitude != null) {
            return {
              latitude: Number(firstPlot.latitude),
              longitude: Number(firstPlot.longitude),
            };
          }
        } catch {
          // fall back below
        }

        return getFallbackLocation();
      });

      const report = await getWeatherReportWithFallback(coords);
      setWeather(report);
      setWeatherError(report.source === 'fallback' ? report.error || t('Weather unavailable') : '');
    } catch (error) {
      setWeatherError(error.message || t('Weather unavailable'));
    } finally {
      setWeatherLoading(false);
      setWeatherRefreshing(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F5F7F2', minHeight: '100vh', paddingBottom: '100px', position: 'relative' }}>
      
      {/* 1. Hero Banner Section (Replaces Green Header) */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '85vh',
        backgroundImage: 'url(/wheat_background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        {/* Top White Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,1) 20%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)',
          zIndex: 0
        }}></div>

        {/* Top Content (Titles) */}
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 24px 0 24px' }}>
          
          <h1 style={{ fontSize: '2.8rem', fontWeight: '900', margin: '0', lineHeight: '1.05', letterSpacing: '-1px' }}>
            <span style={{ color: '#B87A38' }}>{t('THE FUTURE OF')}</span><br/>
            <span style={{ color: '#4A6B22' }}>{t('RAGI FARMING')}</span>
          </h1>
          <p style={{ color: '#333', fontSize: '1.05rem', fontWeight: '600', marginTop: '16px', maxWidth: '260px', lineHeight: '1.4' }}>
            {t('HeroSubtitle')}
          </p>
        </div>

        {/* Center Radial Dial */}
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', width: '320px', height: '320px', zIndex: 1 }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <line 
              key={i}
              x1="50" y1="5" x2="50" y2={i % 5 === 0 ? "12" : "8"} 
              stroke="white" 
              strokeWidth={i % 5 === 0 ? "1.5" : "1"} 
              opacity={i > 25 ? 0.3 : 0.9} 
              transform={`rotate(${i * 7.2} 50 50)`} 
            />
          ))}
        </svg>

        {/* Bottom "Welcome" Pill (Replacing Get Started button) */}
        <div style={{ position: 'absolute', bottom: '70px', left: '24px', right: '24px', zIndex: 2 }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '30px',
            padding: '16px',
            textAlign: 'center',
            color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
          }}>
            <span style={{ fontSize: '1.3rem', fontWeight: '800', display: 'block', marginBottom: '4px' }}>{t('Welcome')}, {user?.displayName || t('Farmer')}!</span>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', opacity: 0.95 }}>{currentDate}</div>
          </div>
        </div>
      </div>

      {/* 2. Detailed live weather report */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '18px',
        margin: '-48px 24px 24px 24px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#555', fontWeight: '600' }}>
            <MapPin size={16} color="#688C31" /> {weather?.locationName === 'Current location' ? t('Current location') : (weather?.locationName || t('Anekal, Bengaluru'))}
          </div>
          <button type="button" onClick={refreshWeather} disabled={weatherRefreshing} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <RefreshCw size={16} color="#688C31" style={{ opacity: weatherRefreshing ? 0.5 : 1, animation: weatherRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span style={{ fontSize: '0.75rem', color: '#688C31', fontWeight: '700' }}>{weatherLoading ? t('Loading...') : t('Refresh')}</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#688C31', fontWeight: '800', marginBottom: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: weather?.source === 'live' ? '#2E9B52' : '#D18A2B' }} />
              {weather?.source === 'live' ? t('Live now') : t('Cached weather')}
            </div>
            <div style={{ fontSize: '1rem', color: '#1a1a1a', fontWeight: '700' }}>{weather?.weatherCode != null ? t(`WeatherCode${weather.weatherCode}`, { defaultValue: t('Current conditions') }) : t('Weather unavailable')}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '5px' }}>{t('Updated')} {weather?.updatedAt ? formatWeatherTime(weather.updatedAt, i18n.language === 'kn' ? 'kn-IN' : 'en-US') : '—'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={34} color="#A0C3D2" fill="#e0f2fe" />
            <span style={{ fontSize: '2.15rem', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-1px' }}>
              {weatherLoading ? '—' : weather?.temperatureC != null ? `${Math.round(weather.temperatureC)}°C` : '—'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '7px', marginBottom: '14px' }}>
          {[
            [Thermometer, t('Soil temperature'), weather?.soilTemperatureC, '°C', t('Soil temperature meaning')],
            [Droplets, t('Humidity'), weather?.humidity, '%', t('Humidity meaning')],
            [CloudRain, t('Rain chance'), weather?.precipitationProbability, '%', t('Rain chance meaning')],
            [Wind, t('Wind'), weather?.windSpeed, ' km/h', t('Wind meaning')],
          ].map(([Icon, label, value, unit, meaning]) => (
            <div key={label} style={{ background: '#F7F9F5', borderRadius: '11px', padding: '10px 12px', border: '1px solid #EEF1EA', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', columnGap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#688C31', fontSize: '0.76rem', fontWeight: '800' }}><Icon size={15} /> {label}</div>
                <div style={{ fontSize: '0.66rem', lineHeight: '1.2', color: '#7A7A7A', marginTop: '3px' }}>{meaning}</div>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1a1a1a' }}>{weatherLoading || value == null ? '—' : `${typeof value === 'number' ? Math.round(value * 10) / 10 : value}${unit}`}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '11px', borderTop: '1px solid #F0F2EE', color: '#666', fontSize: '0.7rem' }}>
          <div><strong style={{ color: '#1a1a1a' }}>{t('Today')}:</strong> {weather?.lowTemperatureC != null ? `${Math.round(weather.lowTemperatureC)}°C ${t('low')}` : '—'} · {weather?.highTemperatureC != null ? `${Math.round(weather.highTemperatureC)}°C ${t('high')}` : '—'}</div>
          <div><strong style={{ color: '#1a1a1a' }}>{t('Max wind')}:</strong> {weather?.maxWindSpeed != null ? `${Math.round(weather.maxWindSpeed)} km/h` : '—'}</div>
        </div>

        {(weatherError || weather?.source === 'cache') && (
          <div style={{ marginTop: '14px', fontSize: '0.8rem', color: '#6B7280' }}>{weather?.source === 'cache' ? t('Showing cached weather') : t('Weather unavailable')}</div>
        )}
      </div>

      {/* 3. Finger Millet Information Card (Replacing Search Bar) */}
      <div style={{ margin: '0 24px 28px 24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '4px solid #688C31' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sprout size={18} color="#688C31" /> {t('RagiInfoTitle')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.6', margin: 0 }}>
            {t('RagiInfoText')}
          </p>
        </div>
      </div>

      {/* 5. My Fields Section */}
      <div style={{ margin: '0 24px 24px 24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '16px' }}>{t('My Fields')}</h3>
        <div onClick={() => navigate('/scan')} style={{ 
          height: '180px', 
          borderRadius: '24px', 
          backgroundImage: 'url(/field_aerial.png)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          cursor: 'pointer'
        }}>
          {/* Inner gradient overlay for text readability */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)' }} />
          
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'white' }}>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 4px 0' }}>{t('Anekal Ragi Plot')}</h4>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sprout size={14} /> 40 q/ha {t('Target Yield')}
              </span>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '8px 14px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '700' }}>
              {t('Scan Card')}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Interactive Navigation Bar */}
      <InteractiveMenu 
        items={[
          { label: 'home', icon: Home, route: '/' },
          { label: 'plan', icon: Sprout, route: '/ragi-advisory' },
          { label: 'language', icon: null, route: null },
        ]}
        activeIndex={0} 
        onNavigate={(route) => navigate(route)} 
      />
    </div>
  );
}
