import React, { useState } from 'react';
import { useAlarm } from '../context/AlarmContext';

const AddAlarmModal = ({ isOpen, onClose, initialTitle = '', initialDescription = '' }) => {
  const { addAlarm } = useAlarm();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [timeStr, setTimeStr] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setDescription(initialDescription);
    }
  }, [isOpen, initialTitle, initialDescription]);
  
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !timeStr) return;

    // Convert timeStr (HH:MM) to today's date + time
    const now = new Date();
    const [hours, minutes] = timeStr.split(':');
    const alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes), 0);

    // If time has already passed today, set it for tomorrow
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    try {
      await addAlarm(title, description, alarmTime);
      setTitle('');
      setDescription('');
      setTimeStr('');
      onClose();
    } catch (error) {
      console.error("Failed to schedule alarm", error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#627c4b',
        borderRadius: '24px',
        padding: '32px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.4rem' }}>Schedule Alarm</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', marginBottom: '8px' }}>Alarm Title</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fertilize (Trad.)"
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', marginBottom: '8px' }}>Description (Optional)</label>
            <input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Field 1 needs NPK"
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', marginBottom: '8px' }}>Time</label>
            <input 
              required
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white', boxSizing: 'border-box',
                colorScheme: 'dark' // forces white icon in some browsers
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                flex: 1, padding: '14px', borderRadius: '16px', border: 'none',
                backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              style={{
                flex: 1, padding: '14px', borderRadius: '16px', border: 'none',
                backgroundColor: '#FFF154', color: '#1A1A1A', fontWeight: 'bold'
              }}
            >
              Save Alarm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAlarmModal;
