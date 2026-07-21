import React, { useState, useMemo } from 'react';
import { useAlarm } from '../context/AlarmContext';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InlineAlarmCard = () => {
  const { addAlarm } = useAlarm();
  const { t } = useTranslation();
  
  // Time state
  const [selectedHour, setSelectedHour] = useState(11);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [selectedAmpm, setSelectedAmpm] = useState('AM');

  // Alarm settings state
  const [repeatEnabled, setRepeatEnabled] = useState(true);
  const [selectedDays, setSelectedDays] = useState(['Tuesday', 'Friday']);
  const [ringtone, setRingtone] = useState('Morning Scent');
  const [vibrateEnabled, setVibrateEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Time manipulation helpers
  const incrementHour = () => {
    setSelectedHour(prev => (prev % 12) + 1);
  };
  const decrementHour = () => {
    setSelectedHour(prev => (prev - 2 + 12) % 12 + 1);
  };
  const incrementMinute = () => {
    setSelectedMinute(prev => (prev + 1) % 60);
  };
  const decrementMinute = () => {
    setSelectedMinute(prev => (prev - 1 + 60) % 60);
  };

  // Calculate difference text dynamically
  const timeDifferenceText = useMemo(() => {
    const now = new Date();
    let hour24 = selectedHour;
    if (selectedAmpm === 'PM' && selectedHour < 12) hour24 += 12;
    if (selectedAmpm === 'AM' && selectedHour === 12) hour24 = 0;

    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, selectedMinute, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const diffMs = target - now;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours === 0 && minutes === 0) return t('Alarm set for less than a minute from now');
    if (hours === 0) return t('Alarm set for {{minutes}} minutes from now', { minutes });
    return t('Alarm set for {{hours}} hours and {{minutes}} minutes from now', { hours, minutes });
  }, [selectedHour, selectedMinute, selectedAmpm, t]);

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = async () => {
    const alarmTitle = message || t('Ragi crop hand-weeding');
    let hour24 = selectedHour;
    if (selectedAmpm === 'PM' && selectedHour < 12) hour24 += 12;
    if (selectedAmpm === 'AM' && selectedHour === 12) hour24 = 0;

    const now = new Date();
    const alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, selectedMinute, 0);
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    try {
      await addAlarm(alarmTitle, '', alarmTime, repeatEnabled, selectedDays);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save alarm', err);
    }
  };

  // Helper arrays for wheel view display
  const hoursDisplay = [
    (selectedHour - 1 + 12 - 1) % 12 + 1,
    selectedHour,
    (selectedHour % 12) + 1
  ];

  const minutesDisplay = [
    (selectedMinute - 1 + 60) % 60,
    selectedMinute,
    (selectedMinute + 1) % 60
  ];

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      padding: '24px 20px',
      marginBottom: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      color: '#1A1A1A',
      boxSizing: 'border-box',
      border: '1px solid #EAEAEA'
    }}>
      {savedSuccess && (
        <div style={{ backgroundColor: '#5C763A', color: 'white', padding: '12px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>
          ✓ {t('Alarm Saved for')} {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')} {t(selectedAmpm)}!
        </div>
      )}

      {/* 1. Time Wheel Picker Card (Green) with Controllable Buttons */}
      <div style={{
        backgroundColor: '#5C763A',
        borderRadius: '20px',
        padding: '16px 12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px',
        boxShadow: '0 8px 24px rgba(92,118,58,0.2)'
      }}>
        {/* Hours Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
          <button 
            onClick={incrementHour} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '2px' }}
          >
            <ChevronUp size={24} />
          </button>

          {hoursDisplay.map((h, i) => {
            const isSelected = i === 1;
            return (
              <div 
                key={i}
                onClick={() => setSelectedHour(h)}
                style={{
                  fontSize: isSelected ? '2.4rem' : '1.2rem',
                  fontWeight: isSelected ? '800' : '500',
                  color: isSelected ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  height: isSelected ? '48px' : '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none'
                }}
              >
                {String(h).padStart(2, '0')}
              </div>
            );
          })}

          <button 
            onClick={decrementHour} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '2px' }}
          >
            <ChevronDown size={24} />
          </button>
        </div>

        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', paddingBottom: '4px' }}>:</div>

        {/* Minutes Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
          <button 
            onClick={incrementMinute} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '2px' }}
          >
            <ChevronUp size={24} />
          </button>

          {minutesDisplay.map((m, i) => {
            const isSelected = i === 1;
            return (
              <div 
                key={i}
                onClick={() => setSelectedMinute(m)}
                style={{
                  fontSize: isSelected ? '2.4rem' : '1.2rem',
                  fontWeight: isSelected ? '800' : '500',
                  color: isSelected ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  height: isSelected ? '48px' : '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none'
                }}
              >
                {String(m).padStart(2, '0')}
              </div>
            );
          })}

          <button 
            onClick={decrementMinute} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '2px' }}
          >
            <ChevronDown size={24} />
          </button>
        </div>

        {/* AM / PM Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', marginLeft: '6px' }}>
          <div 
            onClick={() => setSelectedAmpm('AM')}
            style={{
              fontSize: selectedAmpm === 'AM' ? '1.8rem' : '1.1rem',
              fontWeight: selectedAmpm === 'AM' ? '800' : '500',
              color: selectedAmpm === 'AM' ? 'white' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none'
            }}
          >
            AM
          </div>
          <div 
            onClick={() => setSelectedAmpm('PM')}
            style={{
              fontSize: selectedAmpm === 'PM' ? '1.8rem' : '1.1rem',
              fontWeight: selectedAmpm === 'PM' ? '800' : '500',
              color: selectedAmpm === 'PM' ? 'white' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none'
            }}
          >
            PM
          </div>
        </div>
      </div>

      {/* 2. Dynamic Time Difference Text */}
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
        {timeDifferenceText.split(/(\d+ hours|\d+ minutes)/).map((part, idx) => {
          if (/^\d+/.test(part)) {
            return <strong key={idx} style={{ color: '#1A1A1A' }}>{part}</strong>;
          }
          return part;
        })}
      </div>

      {/* 3. Repeat Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#1A1A1A' }}>{t('Repeat')}</span>
        <div 
          onClick={() => setRepeatEnabled(!repeatEnabled)}
          style={{
            width: '46px', height: '26px', backgroundColor: repeatEnabled ? '#5C763A' : '#CCC',
            borderRadius: '13px', padding: '2px', cursor: 'pointer', transition: 'background-color 0.2s',
            display: 'flex', alignItems: 'center'
          }}
        >
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white',
            transform: repeatEnabled ? 'translateX(20px)' : 'translateX(0px)',
            transition: 'transform 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}></div>
        </div>
      </div>

      {/* 4. Days Selection Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
        {daysList.map((day) => {
          const isSelected = selectedDays.includes(day);
          return (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              style={{
                backgroundColor: isSelected ? '#5C763A' : '#F5F8F2',
                color: isSelected ? 'white' : '#555',
                border: isSelected ? 'none' : '1px solid #E2E8DF',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.85rem',
                fontWeight: isSelected ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t(day)}
            </button>
          );
        })}
      </div>

      {/* 5. Options (Ringtone, Vibrate, Message) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#555' }}>{t('Ringtone')}</span>
          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1A1A1A' }}>{t(ringtone)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#555' }}>{t('Vibrate')}</span>
          <div 
            onClick={() => setVibrateEnabled(!vibrateEnabled)}
            style={{
              width: '46px', height: '26px', backgroundColor: vibrateEnabled ? '#5C763A' : '#CCC',
              borderRadius: '13px', padding: '2px', cursor: 'pointer', transition: 'background-color 0.2s',
              display: 'flex', alignItems: 'center'
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white',
              transform: vibrateEnabled ? 'translateX(20px)' : 'translateX(0px)',
              transition: 'transform 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#555' }}>{t('Message')}</span>
          <input 
            value={message || t('Ragi crop hand-weeding')}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('Enter your message')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '1px solid #CCC',
              color: '#1A1A1A',
              textAlign: 'right',
              fontSize: '0.95rem',
              fontWeight: '600',
              outline: 'none',
              padding: '4px 0',
              width: '180px'
            }}
          />
        </div>

      </div>

      {/* 6. SET ALARM Button */}
      <button 
        onClick={handleSave}
        style={{
          width: '100%',
          height: '56px',
          borderRadius: '28px',
          backgroundColor: '#5C763A',
          color: 'white',
          border: 'none',
          fontSize: '1.1rem',
          fontWeight: '800',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(92,118,58,0.3)',
          transition: 'transform 0.1s'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {t('SET ALARM')}
      </button>

    </div>
  );
};

export default InlineAlarmCard;
