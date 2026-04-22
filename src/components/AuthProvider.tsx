import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    // Set loading initially just to be safe, though it's already true by default
    setIsLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Sync user in store
          setUser(user);
          
          // Ensure user exists in Firestore
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
        } else {
          // Clear user from store
          setUser(null);
        }
      } catch (error) {
        console.error("Auth sync error:", error);
      } finally {
        // Always mark loading as false once Firebase resolves
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setIsLoading]);

  return <>{children}</>;
}
