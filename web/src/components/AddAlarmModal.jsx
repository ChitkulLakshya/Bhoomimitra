import React, { useState, useEffect, useMemo } from 'react';
import { useAlarm } from '../context/AlarmContext';
import { X } from 'lucide-react';

const AddAlarmModal = ({ isOpen, onClose, initialTitle = '', initialDescription = '' }) => {
  const { addAlarm } = useAlarm();
  
  // Time state
  const [selectedHour, setSelectedHour] = useState(11);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [selectedAmpm, setSelectedAmpm] = useState('AM');

  // Alarm settings state
  const [repeatEnabled, setRepeatEnabled] = useState(true);
  const [selectedDays, setSelectedDays] = useState(['Tuesday', 'Friday']);
  const [ringtone, setRingtone] = useState('Morning Scent');
  const [vibrateEnabled, setVibrateEnabled] = useState(false);
  const [message, setMessage] = useState(initialTitle || '');

  useEffect(() => {
    if (isOpen && initialTitle) {
      setMessage(initialTitle);
    }
  }, [isOpen, initialTitle]);

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

    if (hours === 0 && minutes === 0) return 'Alarm set for less than a minute from now';
    if (hours === 0) return `Alarm set for ${minutes} minutes from now`;
    return `Alarm set for ${hours} hours and ${minutes} minutes from now`;
  }, [selectedHour, selectedMinute, selectedAmpm]);

  if (!isOpen) return null;

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = async () => {
    const alarmTitle = message || initialTitle || 'Alarm';
    let hour24 = selectedHour;
    if (selectedAmpm === 'PM' && selectedHour < 12) hour24 += 12;
    if (selectedAmpm === 'AM' && selectedHour === 12) hour24 = 0;

    const now = new Date();
    const alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, selectedMinute, 0);
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    try {
      await addAlarm(alarmTitle, selectedDays.join(', '), alarmTime);
      onClose();
    } catch (err) {
      console.error('Failed to save alarm', err);
    }
  };

  // Helper arrays for wheel view display
  const hoursDisplay = [
    (selectedHour - 2 + 12 - 1) % 12 + 1,
    (selectedHour - 1 + 12 - 1) % 12 + 1,
    selectedHour,
    (selectedHour % 12) + 1,
    ((selectedHour + 1) % 12) + 1
  ];

  const minutesDisplay = [
    (selectedMinute - 2 + 60) % 60,
    (selectedMinute - 1 + 60) % 60,
    selectedMinute,
    (selectedMinute + 1) % 60,
    (selectedMinute + 2) % 60
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#1C2B14',
        borderTopLeftRadius: '32px',
        borderTopRightRadius: '32px',
        padding: '24px 20px 32px 20px',
        width: '100%',
        maxWidth: '440px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        color: 'white',
        boxSizing: 'border-box'
      }}>
        
        {/* 1. Time Wheel Picker Card (White) */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '20px 16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          {/* Hours Wheel */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
            {hoursDisplay.map((h, i) => {
              const isSelected = i === 2;
              return (
                <div 
                  key={i}
                  onClick={() => setSelectedHour(h)}
                  style={{
                    fontSize: isSelected ? '2.4rem' : '1.3rem',
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#1A1A1A' : '#AAA',
                    cursor: 'pointer',
                    height: isSelected ? '48px' : '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {String(h).padStart(2, '0')}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', paddingBottom: '4px' }}>:</div>

          {/* Minutes Wheel */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
            {minutesDisplay.map((m, i) => {
              const isSelected = i === 2;
              return (
                <div 
                  key={i}
                  onClick={() => setSelectedMinute(m)}
                  style={{
                    fontSize: isSelected ? '2.4rem' : '1.3rem',
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#1A1A1A' : '#AAA',
                    cursor: 'pointer',
                    height: isSelected ? '48px' : '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {String(m).padStart(2, '0')}
                </div>
              );
            })}
          </div>

          {/* AM / PM Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', marginLeft: '8px' }}>
            <div 
              onClick={() => setSelectedAmpm('AM')}
              style={{
                fontSize: selectedAmpm === 'AM' ? '1.8rem' : '1.1rem',
                fontWeight: selectedAmpm === 'AM' ? '800' : '600',
                color: selectedAmpm === 'AM' ? '#1A1A1A' : '#AAA',
                cursor: 'pointer',
                height: '36px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              AM
            </div>
            <div 
              onClick={() => setSelectedAmpm('PM')}
              style={{
                fontSize: selectedAmpm === 'PM' ? '1.8rem' : '1.1rem',
                fontWeight: selectedAmpm === 'PM' ? '800' : '600',
                color: selectedAmpm === 'PM' ? '#1A1A1A' : '#AAA',
                cursor: 'pointer',
                height: '36px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              PM
            </div>
          </div>
        </div>

        {/* 2. Dynamic Time Difference Text */}
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#DDD', marginBottom: '24px' }}>
          {timeDifferenceText.split(/(\d+ hours|\d+ minutes)/).map((part, idx) => {
            if (/^\d+/.test(part)) {
              return <strong key={idx} style={{ color: 'white' }}>{part}</strong>;
            }
            return part;
          })}
        </div>

        {/* 3. Repeat Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '1rem', fontWeight: '700', color: 'white' }}>Repeat</span>
          <div 
            onClick={() => setRepeatEnabled(!repeatEnabled)}
            style={{
              width: '50px', height: '28px', backgroundColor: repeatEnabled ? '#5C763A' : '#334426',
              borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'background-color 0.2s',
              display: 'flex', alignItems: 'center'
            }}
          >
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'white',
              transform: repeatEnabled ? 'translateX(22px)' : 'translateX(0px)',
              transition: 'transform 0.2s ease'
            }}></div>
          </div>
        </div>

        {/* 4. Days Selection Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {daysList.map((day) => {
            const isSelected = selectedDays.includes(day);
            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                style={{
                  backgroundColor: isSelected ? 'white' : '#2F4024',
                  color: isSelected ? '#1C2B14' : '#BBB',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* 5. Options (Ringtone, Vibrate, Message) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#DDD' }}>Ringtone</span>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white' }}>{ringtone}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#DDD' }}>Vibrate</span>
            <div 
              onClick={() => setVibrateEnabled(!vibrateEnabled)}
              style={{
                width: '50px', height: '28px', backgroundColor: vibrateEnabled ? '#5C763A' : '#334426',
                borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'background-color 0.2s',
                display: 'flex', alignItems: 'center'
              }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'white',
                transform: vibrateEnabled ? 'translateX(22px)' : 'translateX(0px)',
                transition: 'transform 0.2s ease'
              }}></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#DDD' }}>Message</span>
            <input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '1px solid #445536',
                color: 'white',
                textAlign: 'right',
                fontSize: '0.95rem',
                outline: 'none',
                padding: '4px'
              }}
            />
          </div>

        </div>

        {/* 6. Bottom Action Bar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={onClose}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              backgroundColor: '#2F4024',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>

          <button 
            onClick={handleSave}
            style={{
              flex: 1,
              height: '60px',
              borderRadius: '30px',
              backgroundColor: 'white',
              color: '#1C2B14',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}
          >
            SET ALARM
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddAlarmModal;
