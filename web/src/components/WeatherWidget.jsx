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

  const handleRefreshLocation = async () => {
    setLoading(true);
    try {
      // Clear cache so it forces a new geolocation check
      localStorage.removeItem('bhoomimitra.weather.cache.v1');
      const report = await getWeatherReportWithFallback();
      setWeather(report);
    } catch (err) {
      console.error('Weather refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const locName = weather.locationName || t('Current location');

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
          <div 
            onClick={handleRefreshLocation}
            title={t('Click to detect current location')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', color: '#1A1A1A', cursor: 'pointer' }}
          >
            <MapPin size={18} color="#5C763A" />
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#2C3A20' }}>{locName}</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'left', marginBottom: '0' }}>
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


    </div>
  );
};

export default WeatherWidget;
