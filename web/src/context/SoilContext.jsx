import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const SoilContext = createContext();

export const useSoil = () => useContext(SoilContext);

export const SoilProvider = ({ children }) => {
  const { user } = useAuth();
  const [soilData, setSoilData] = useState(null);
  const [allSoilData, setAllSoilData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch soil data from Firestore
  useEffect(() => {
    if (!user) {
      setSoilData(null);
      setAllSoilData([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'soil_tests'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        // Just take the most recent soil test (assuming sorted or just one active) for soilData
        const doc = snapshot.docs[0];
        setSoilData({ id: doc.id, ...doc.data() });
        
        // Save all tests for profile history
        setAllSoilData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        // Create dummy soil data if none exists
        await createDummySoilTest(user.id);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createDummySoilTest = async (userId) => {
    try {
      await addDoc(collection(db, 'soil_tests'), {
        userId,
        ph: 6.8,
        nitrogen: 45, // mg/kg
        phosphorus: 20, // mg/kg
        potassium: 110, // mg/kg
        moisture: 'Optimal',
        testedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating dummy soil test:", error);
    }
  };

  return (
    <SoilContext.Provider value={{ soilData, allSoilData, loading }}>
      {children}
    </SoilContext.Provider>
  );
};
