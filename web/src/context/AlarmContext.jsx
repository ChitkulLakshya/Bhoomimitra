import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const AlarmContext = createContext();

// Simple short beep sound base64
const beepSound = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';

export const useAlarm = () => useContext(AlarmContext);

export const AlarmProvider = ({ children }) => {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState([]);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Check initial permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionsGranted(true);
      }
    }
  }, []);

  // Fetch alarms from Firestore
  useEffect(() => {
    if (!user) {
      setAlarms([]);
      return;
    }

    const q = query(
      collection(db, 'alarms'),
      where('userId', '==', user.id),
      orderBy('time', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlarms = [];
      snapshot.forEach((doc) => {
        fetchedAlarms.push({ id: doc.id, ...doc.data() });
      });
      setAlarms(fetchedAlarms);
    });

    return () => unsubscribe();
  }, [user]);

  // Polling mechanism to check if any alarm has passed its time
  useEffect(() => {
    if (!user || alarms.length === 0) return;

    const checkAlarms = () => {
      const now = new Date();
      
      alarms.forEach(async (alarm) => {
        if (!alarm.triggered && alarm.time && typeof alarm.time.toDate === 'function') {
          const alarmTime = alarm.time.toDate();
          
          if (now >= alarmTime) {
            // Trigger the alarm
            triggerNotification(alarm);
            
            // Mark as triggered in Firestore
            try {
              const alarmRef = doc(db, 'alarms', alarm.id);
              await updateDoc(alarmRef, { triggered: true });
            } catch (err) {
              console.error("Error updating alarm trigger status:", err);
            }
          }
        }
      });
    };

    const intervalId = setInterval(checkAlarms, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [alarms, user]);

  const requestPermissions = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    // Initialize audio context to unlock sound on this interaction
    if (!audioRef.current) {
      audioRef.current = new Audio(beepSound);
    }
    audioRef.current.play().catch(e => console.log('Audio init blocked, but context unlocked', e));

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPermissionsGranted(true);
    }
  };

  const triggerNotification = (alarm) => {
    if (permissionsGranted && 'Notification' in window) {
      // Play sound
      if (!audioRef.current) {
        audioRef.current = new Audio(beepSound);
      }
      audioRef.current.play().catch(e => console.log('Failed to play alarm sound', e));

      // Show native notification
      new Notification(`Alarm: ${alarm.title}`, {
        body: alarm.description || 'Time for your scheduled farm activity.',
        icon: '/ragi.png'
      });
    } else {
      // Fallback if no permissions
      alert(`ALARM: ${alarm.title}\n${alarm.description}`);
    }
  };

  const addAlarm = async (title, description, timeDateObj) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'alarms'), {
        userId: user.id,
        title,
        description,
        time: timeDateObj,
        triggered: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding alarm: ", error);
      throw error;
    }
  };

  return (
    <AlarmContext.Provider value={{ alarms, addAlarm, requestPermissions, permissionsGranted }}>
      {children}
    </AlarmContext.Provider>
  );
};
