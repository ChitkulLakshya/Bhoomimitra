import React from 'react';
import { useAlarm } from '../context/AlarmContext';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

const SavedAlarmsList = () => {
  const { alarms, deleteAlarm, toggleAlarm } = useAlarm();
  const { t } = useTranslation();

  if (!alarms || alarms.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      padding: '24px 20px',
      marginBottom: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      border: '1px solid #EAEAEA'
    }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '16px' }}>
        {t('Saved Alarms')}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {alarms.map((alarm) => {
          let timeDate;
          if (alarm.time?.toDate) {
            timeDate = alarm.time.toDate();
          } else if (alarm.time) {
            timeDate = new Date(alarm.time);
          } else {
            return null;
          }

          const hours = timeDate.getHours();
          const minutes = timeDate.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const formattedHours = hours % 12 || 12;
          const formattedMinutes = minutes.toString().padStart(2, '0');
          const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
          
          // default true if undefined
          const isEnabled = alarm.enabled !== false; 

          return (
            <div key={alarm.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F9FBF7',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid #EBF1E5',
              transition: 'opacity 0.2s',
              opacity: isEnabled ? 1 : 0.6
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: isEnabled ? '#1A1A1A' : '#777' }}>
                  {timeString}
                </div>
                <div style={{ fontSize: '0.9rem', color: isEnabled ? '#667757' : '#999', fontWeight: '600', marginTop: '4px' }}>
                  {alarm.title}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Toggle Switch */}
                <div 
                  onClick={() => toggleAlarm(alarm.id, isEnabled)}
                  style={{
                    width: '46px', height: '26px', backgroundColor: isEnabled ? '#5C763A' : '#CCC',
                    borderRadius: '13px', padding: '2px', cursor: 'pointer', transition: 'background-color 0.2s',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white',
                    transform: isEnabled ? 'translateX(20px)' : 'translateX(0px)',
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}></div>
                </div>

                {/* Delete Button */}
                <button 
                  onClick={() => deleteAlarm(alarm.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#D9534F', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0.8
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                  onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavedAlarmsList;
