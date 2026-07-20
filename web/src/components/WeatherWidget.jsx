import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Cloud, Moon, Star } from 'lucide-react';
import { getWeatherReportWithFallback, formatWeatherTime } from '../utils/weather';

const WeatherWidget = () => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const report = await getWeatherReportWithFallback();
        setWeather(report);
      } catch (err) {
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white', borderRadius: '32px', padding: '24px',
        margin: '16px', marginTop: '24px', minHeight: '320px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}>
        <div style={{ color: '#888', fontWeight: '600' }}>{t('Loading...')}</div>
      </div>
    );
  }

  if (!weather) return null;

  const tempC = weather.temperatureC !== null ? Math.round(weather.temperatureC) : '--';
  const highC = weather.highTemperatureC !== null ? Math.round(weather.highTemperatureC) : '--';
  const lowC = weather.lowTemperatureC !== null ? Math.round(weather.lowTemperatureC) : '--';
  const humidity = weather.humidity !== null ? `${Math.round(weather.humidity)}%` : '--';
  const precip = weather.precipitationMm !== null ? `${weather.precipitationMm}mm` : '--';
  const pressure = weather.surfacePressure !== null ? `${Math.round(weather.surfacePressure)} hpa` : '--';
  const wind = weather.windSpeed !== null ? `${Math.round(weather.windSpeed)} km/h` : '--';
  
  const sunrise = weather.sunrise ? formatWeatherTime(weather.sunrise) : '--:--';
  const sunset = weather.sunset ? formatWeatherTime(weather.sunset) : '--:--';

  // If we have a location name from the API or user setting, display it. Otherwise default to Sonoma
  const locName = weather.locationName !== 'Current location' ? weather.locationName : 'Sonoma County';

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '32px',
      padding: '24px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      margin: '16px',
      marginTop: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        
        {/* Left Side: Location & Temp */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', color: '#1A1A1A' }}>
            <MapPin size={18} />
            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{locName}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '4rem', fontWeight: '700', lineHeight: '1', color: '#1A1A1A', display: 'flex', alignItems: 'flex-start' }}>
              {tempC > 0 ? `+${tempC}` : tempC}<span style={{ fontSize: '2rem', marginTop: '4px' }}>°C</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', color: '#666', fontSize: '0.9rem', fontWeight: '500' }}>
              <span>H: {highC}°C</span>
              <span>L: {lowC}°C</span>
            </div>
          </div>
        </div>

        {/* Right Side: Weather Icon (Custom) */}
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
           {/* If day, could show Sun instead of Moon, but let's stick to the styling provided */}
           <Moon size={32} fill="#FFD166" color="#333" style={{ position: 'absolute', top: '10px', right: '5px' }} />
           <Cloud size={48} fill="#90E0EF" color="#333" style={{ position: 'absolute', bottom: '10px', left: '0' }} />
           <Star size={12} fill="#333" color="#333" style={{ position: 'absolute', top: '5px', left: '15px' }} />
           <Star size={10} fill="#333" color="#333" style={{ position: 'absolute', top: '0', left: '35px' }} />
           <Star size={14} fill="#333" color="#333" style={{ position: 'absolute', top: '25px', left: '5px' }} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: '1px', borderBottom: '2px dashed #EAEAEA', margin: '24px 0' }}></div>

      {/* 4 Column Data Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'left', marginBottom: '32px' }}>
        <div>
          <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>{t('Humidity')}</div>
          <div style={{ color: '#1A1A1A', fontSize: '0.9rem', fontWeight: '700' }}>{humidity}</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>{t('Precipitation')}</div>
          <div style={{ color: '#1A1A1A', fontSize: '0.9rem', fontWeight: '700' }}>{precip}</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>{t('Pressure')}</div>
          <div style={{ color: '#1A1A1A', fontSize: '0.9rem', fontWeight: '700' }}>{pressure}</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>{t('Wind')}</div>
          <div style={{ color: '#1A1A1A', fontSize: '0.9rem', fontWeight: '700' }}>{wind}</div>
        </div>
      </div>

      {/* Sun Trajectory Arc */}
      <div style={{ position: 'relative', height: '80px', width: '100%' }}>
        <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none">
          {/* Dashed arc path */}
          <path 
            d="M 10 70 Q 150 -10 290 70" 
            fill="none" 
            stroke="#CCC" 
            strokeWidth="2" 
            strokeDasharray="6 6"
          />
        </svg>
        {/* Sun Icon positioned on the arc */}
        <div style={{ 
          position: 'absolute', 
          top: '15px', 
          left: '60%', 
          transform: 'translate(-50%, -50%)',
          width: '24px',
          height: '24px',
          backgroundColor: '#FFD166',
          borderRadius: '50%',
          boxShadow: '0 0 10px 4px rgba(255, 209, 102, 0.4)'
        }}></div>

        {/* Sunrise/Sunset times */}
        <div style={{ position: 'absolute', bottom: '0', left: '0', textAlign: 'left' }}>
          <div style={{ color: '#1A1A1A', fontWeight: '700', fontSize: '0.85rem' }}>{sunrise}</div>
          <div style={{ color: '#888', fontSize: '0.8rem' }}>{t('Sunrise')}</div>
        </div>
        <div style={{ position: 'absolute', bottom: '0', right: '0', textAlign: 'right' }}>
          <div style={{ color: '#1A1A1A', fontWeight: '700', fontSize: '0.85rem' }}>{sunset}</div>
          <div style={{ color: '#888', fontSize: '0.8rem' }}>{t('Sunset')}</div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
