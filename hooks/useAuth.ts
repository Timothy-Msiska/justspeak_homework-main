'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth, supabase } from '@/lib/firebase';
import type { DBUser } from '@/lib/db';

const googleProvider = new GoogleAuthProvider();

// Fetch the user's profile from Supabase using their Firebase UID
async function fetchProfile(uid: string): Promise<DBUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) return null;
  return data as DBUser;
}

// Write a new user profile to Supabase on first sign-up
async function createProfile(
  uid: string,
  email: string,
  name: string,
  role: 'teacher' | 'learner'
): Promise<DBUser | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({ id: uid, email, name, role })
    .select()
    .single();

  if (error) return null;
  return data as DBUser;
}

export function useAuth() {
  const [user, setUser] = useState<DBUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔁 Firebase handles the session; Supabase provides the profile + role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      getFirebaseAuth(),
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const profile = await fetchProfile(firebaseUser.uid);
          if (profile) {
            setUser(profile);
            setIsAuthenticated(true);
          } else {
            // Profile missing — sign out to avoid broken state
            await signOut(getFirebaseAuth());
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ✅ LOGIN
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ SIGNUP
  const signup = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: 'teacher' | 'learner'
  ) => {
    setIsLoading(true);
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password
      );

      await updateProfile(firebaseUser, { displayName: name });

      const profile = await createProfile(firebaseUser.uid, email, name, role);
      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ GOOGLE SIGN IN
  const signInWithGoogle = useCallback(async (
    role: 'teacher' | 'learner' = 'learner'
  ) => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(getFirebaseAuth(), googleProvider);
      const firebaseUser = result.user;

      let profile = await fetchProfile(firebaseUser.uid);

      if (!profile) {
        profile = await createProfile(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName || '',
          role
        );
      }

      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ RESET PASSWORD
  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ LOGOUT
  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    signInWithGoogle,
    resetPassword,
    logout,
  };
}

// 🎯 Role helper
export function useRole() {
  const { user } = useAuth();
  return user?.role || null;
}