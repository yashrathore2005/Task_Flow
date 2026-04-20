import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Ensure user doc exists
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || '',
              theme: 'system',
              createdAt: Date.now()
            });
          }
        } catch (e) {
          console.error("Failed to fetch/create user profile", e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
