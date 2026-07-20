import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const CropContext = createContext();

export const useCrop = () => useContext(CropContext);

export const CropProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeCrop, setActiveCrop] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch active crop from Firestore
  useEffect(() => {
    if (!user) {
      setActiveCrop(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'crops'),
      where('userId', '==', user.id),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        // Just take the first active crop for now
        const cropDoc = snapshot.docs[0];
        const data = cropDoc.data();
        
        // Calculate current day
        let currentDay = 0;
        if (data.plantingDate) {
          const plantDate = data.plantingDate.toDate();
          const today = new Date();
          const diffTime = Math.abs(today - plantDate);
          currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        setActiveCrop({ 
          id: cropDoc.id, 
          ...data,
          currentDay
        });
      } else {
        // Automatically create a dummy active crop if none exists so the UI has something to show
        await createDummyCrop(user.id);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createDummyCrop = async (userId) => {
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

    try {
      await addDoc(collection(db, 'crops'), {
        userId,
        name: 'Ragi',
        status: 'active',
        plantingDate: fortyDaysAgo,
        totalDays: 120,
        currentPhase: 'Hand-weeding complete'
      });
    } catch (error) {
      console.error("Error creating dummy crop:", error);
    }
  };

  return (
    <CropContext.Provider value={{ activeCrop, loading }}>
      {children}
    </CropContext.Provider>
  );
};
