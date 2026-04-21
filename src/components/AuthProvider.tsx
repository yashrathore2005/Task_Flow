import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Run profile check in background so we don't block the main UI loading state
        // unless strictly necessary. For most of this app, the Firebase Auth state is enough.
        const checkUserProfile = async () => {
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
        };
        
        // We call it but we don't necessarily await it before setting loading to false
        // to speed up the initial app load for logged in users.
        checkUserProfile().finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
